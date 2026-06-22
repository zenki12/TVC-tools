import { GoogleGenAI, Type, type Schema } from '@google/genai';
import {
  validateMeetingMinutes,
  type MeetingMinutes,
  type MinutesMetadata,
} from '../src/modules/meeting-minutes/types.js';

const stringSchema: Schema = { type: Type.STRING };
const stringArraySchema: Schema = { type: Type.ARRAY, items: stringSchema };
const rowsSchema: Schema = {
  type: Type.ARRAY,
  items: { type: Type.ARRAY, items: stringSchema },
};
const tableSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    columns: stringArraySchema,
    rows: rowsSchema,
  },
  required: ['columns', 'rows'],
};
const blockSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['paragraph', 'bullets', 'table'] },
    text: stringSchema,
    items: stringArraySchema,
    columns: stringArraySchema,
    rows: rowsSchema,
  },
  required: ['type'],
};
const blocksSchema: Schema = { type: Type.ARRAY, items: blockSchema };

export const minutesResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: stringSchema,
    metadata: {
      type: Type.OBJECT,
      properties: {
        khachHang: stringSchema,
        noiDung: stringSchema,
        thoiGian: stringSchema,
        ngay: stringSchema,
        diaDiem: stringSchema,
        thanhPhan: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              toChuc: stringSchema,
              nguoi: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { hoTen: stringSchema, chucDanh: stringSchema },
                  required: ['hoTen', 'chucDanh'],
                },
              },
            },
            required: ['toChuc', 'nguoi'],
          },
        },
      },
      required: ['khachHang', 'noiDung', 'thoiGian', 'ngay', 'diaDiem', 'thanhPhan'],
    },
    mucTieu: stringArraySchema,
    noiDungChinh: {
      type: Type.OBJECT,
      properties: {
        tongQuan: blocksSchema,
        tieuMuc: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { heading: stringSchema, blocks: blocksSchema },
            required: ['heading', 'blocks'],
          },
        },
        gopY: stringArraySchema,
      },
      required: ['tongQuan', 'tieuMuc', 'gopY'],
    },
    tongKet: {
      type: Type.OBJECT,
      properties: {
        tongKet: stringArraySchema,
        mucTieuSau: stringArraySchema,
        keHoachHanhDong: tableSchema,
      },
      required: ['tongKet', 'mucTieuSau', 'keHoachHanhDong'],
    },
  },
  required: ['title', 'metadata', 'mucTieu', 'noiDungChinh', 'tongKet'],
};

function buildPrompt(metadata: MinutesMetadata, rawText: string, correction = false) {
  return `Bạn là thư ký chuyên nghiệp. Hãy chuyển ghi chú cuộc họp thành biên bản tiếng Việt rõ ràng, trung thực và súc tích.

Yêu cầu:
- Giữ nguyên metadata đã cung cấp, không tự thay đổi tên, ngày, giờ hoặc thành phần.
- Không bịa thông tin không xuất hiện trong ghi chú.
- Phân loại nội dung thành mục tiêu, tổng quan, các tiểu mục, góp ý, tổng kết, mục tiêu sau cuộc họp và kế hoạch hành động.
- Dùng paragraph cho đoạn văn, bullets cho danh sách và table cho dữ liệu thực sự có hàng/cột.
- Mỗi hàng table phải có đúng số ô bằng số columns.
${correction ? '- Phản hồi trước không hợp lệ. Hãy sửa và chỉ trả về JSON đúng schema.' : ''}

METADATA:
${JSON.stringify(metadata)}

GHI CHÚ THÔ:
${rawText}`;
}

function parseGeneratedMinutes(text: string | undefined): MeetingMinutes {
  if (!text) throw new Error('Gemini không trả về nội dung JSON');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error('Gemini trả về JSON không hợp lệ', { cause: error });
  }
  return validateMeetingMinutes(parsed);
}

export async function generateMinutes(
  metadata: MinutesMetadata,
  rawText: string,
  apiKey: string,
): Promise<MeetingMinutes> {
  if (!apiKey) throw new Error('Thiếu Gemini API key');

  const ai = new GoogleGenAI({ apiKey });
  let parseError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: buildPrompt(metadata, rawText, attempt === 1),
      config: {
        responseMimeType: 'application/json',
        responseSchema: minutesResponseSchema,
      },
    });

    try {
      return parseGeneratedMinutes(response.text);
    } catch (error) {
      parseError = error;
    }
  }

  throw new Error('Gemini không thể trả về biên bản đúng cấu trúc sau 2 lần thử', {
    cause: parseError,
  });
}

export async function checkGeminiKey(apiKey: string): Promise<void> {
  const ai = new GoogleGenAI({ apiKey });
  await ai.models.get({ model: 'gemini-2.5-flash' });
}
