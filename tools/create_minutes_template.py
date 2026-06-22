from __future__ import annotations

import copy
import io
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "TVC_Biên bản mẫu.docx"
OUTPUT = ROOT / "server" / "templates" / "bien-ban-template.docx"
DOCUMENT_PART = "word/document.xml"

W_URI = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
XML_URI = "http://www.w3.org/XML/1998/namespace"
W = f"{{{W_URI}}}"


def register_namespaces(xml_bytes: bytes) -> None:
    for _, namespace in ET.iterparse(io.BytesIO(xml_bytes), events=("start-ns",)):
        prefix, uri = namespace
        if prefix not in {"xml", "xmlns"}:
            ET.register_namespace(prefix, uri)


def paragraph_text(element: ET.Element) -> str:
    return "".join(node.text or "" for node in element.iter(f"{W}t"))


def set_paragraph_text(paragraph: ET.Element, text: str) -> None:
    source_run_properties = paragraph.find(f"{W}r/{W}rPr")
    paragraph_properties = paragraph.find(f"{W}pPr")
    for child in list(paragraph):
        if child is not paragraph_properties:
            paragraph.remove(child)

    run = ET.SubElement(paragraph, f"{W}r")
    if source_run_properties is not None:
        run.append(copy.deepcopy(source_run_properties))
    text_node = ET.SubElement(run, f"{W}t")
    text_node.set(f"{{{XML_URI}}}space", "preserve")
    text_node.text = text


def replace_cell_content(cell: ET.Element, paragraphs: list[str]) -> None:
    original_paragraph = cell.find(f"{W}p")
    cell_properties = cell.find(f"{W}tcPr")
    for child in list(cell):
        if child is not cell_properties:
            cell.remove(child)

    for text in paragraphs:
        paragraph = (
            copy.deepcopy(original_paragraph)
            if original_paragraph is not None
            else ET.Element(f"{W}p")
        )
        set_paragraph_text(paragraph, text)
        cell.append(paragraph)


def raw_paragraph(tag: str) -> ET.Element:
    paragraph = ET.Element(f"{W}p")
    run = ET.SubElement(paragraph, f"{W}r")
    text = ET.SubElement(run, f"{W}t")
    text.text = f"{{@{tag}}}"
    return paragraph


def derive_document_xml(source_xml: bytes) -> bytes:
    register_namespaces(source_xml)
    root = ET.fromstring(source_xml)
    body = root.find(f"{W}body")
    if body is None:
        raise RuntimeError("Template gốc không có w:body")

    original_children = list(body)
    paragraphs = [node for node in original_children if node.tag == f"{W}p"]
    tables = [node for node in original_children if node.tag == f"{W}tbl"]
    section_properties = next(
        (node for node in original_children if node.tag == f"{W}sectPr"), None
    )
    if len(tables) < 2 or section_properties is None:
        raise RuntimeError("Template gốc thiếu bảng metadata hoặc section properties")

    def paragraph_with_text(text: str) -> ET.Element:
        for paragraph in paragraphs:
            if paragraph_text(paragraph).strip() == text:
                return copy.deepcopy(paragraph)
        raise RuntimeError(f"Không tìm thấy heading trong template: {text}")

    title = copy.deepcopy(paragraphs[1])
    set_paragraph_text(title, "{title}")

    metadata_table = copy.deepcopy(tables[0])
    metadata_rows = metadata_table.findall(f"{W}tr")
    replace_cell_content(metadata_rows[0].findall(f"{W}tc")[1], ["{khachHang}"])
    replace_cell_content(metadata_rows[1].findall(f"{W}tc")[1], ["{noiDung}"])
    replace_cell_content(metadata_rows[2].findall(f"{W}tc")[1], ["{thoiGian}"])
    replace_cell_content(metadata_rows[2].findall(f"{W}tc")[3], ["{ngay}"])
    replace_cell_content(metadata_rows[3].findall(f"{W}tc")[1], ["{diaDiem}"])

    participants_table = copy.deepcopy(tables[1])
    participant_rows = participants_table.findall(f"{W}tr")
    for extra_row in participant_rows[2:]:
        participants_table.remove(extra_row)
    loop_cells = participant_rows[1].findall(f"{W}tc")
    replace_cell_content(loop_cells[0], ["{#thanhPhan}{toChuc}"])
    replace_cell_content(
        loop_cells[1],
        ["{#nguoi}", "{hoTen} – {chucDanh}", "{/nguoi}{/thanhPhan}"],
    )

    new_body: list[ET.Element] = [
        copy.deepcopy(paragraphs[0]),
        title,
        copy.deepcopy(paragraphs[3]),
        metadata_table,
        copy.deepcopy(paragraphs[5]),
        participants_table,
        copy.deepcopy(paragraphs[7]),
        paragraph_with_text("MỤC TIÊU:"),
        raw_paragraph("mucTieuXml"),
        paragraph_with_text("NỘI DUNG CHÍNH:"),
        paragraph_with_text("Tổng quan cuộc họp"),
        raw_paragraph("tongQuanXml"),
        raw_paragraph("tieuMucXml"),
        paragraph_with_text("Ý kiến và góp ý nổi bật"),
        raw_paragraph("gopYXml"),
        paragraph_with_text("TỔNG KẾT CUỘC HỌP VÀ KẾ HOẠCH TIẾP THEO:"),
        paragraph_with_text("Tổng kết cuộc họp"),
        raw_paragraph("tongKetXml"),
        paragraph_with_text("Mục tiêu sau cuộc họp"),
        raw_paragraph("mucTieuSauXml"),
        paragraph_with_text("Kế hoạch hành động tiếp theo"),
        raw_paragraph("keHoachXml"),
        copy.deepcopy(section_properties),
    ]

    for child in list(body):
        body.remove(child)
    for child in new_body:
        body.append(child)

    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def main() -> None:
    with zipfile.ZipFile(SOURCE, "r") as source_zip:
        source_document = source_zip.read(DOCUMENT_PART)
        derived_document = derive_document_xml(source_document)
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(OUTPUT, "w") as output_zip:
            for info in source_zip.infolist():
                data = derived_document if info.filename == DOCUMENT_PART else source_zip.read(info)
                output_zip.writestr(info, data)

    with zipfile.ZipFile(SOURCE, "r") as source_zip, zipfile.ZipFile(OUTPUT, "r") as output_zip:
        if source_zip.namelist() != output_zip.namelist():
            raise RuntimeError("Danh sách ZIP entry của template dẫn xuất đã thay đổi")
        for name in source_zip.namelist():
            if name != DOCUMENT_PART and source_zip.read(name) != output_zip.read(name):
                raise RuntimeError(f"DOCX part ngoài document.xml bị thay đổi: {name}")

    print(f"Created {OUTPUT}")


if __name__ == "__main__":
    main()
