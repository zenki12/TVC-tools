import { useState } from 'react';
import { DraftEditor } from './DraftEditor';
import { InputStep } from './InputStep';
import { GeminiApiKeyPanel, type GeminiKeyStatus } from './GeminiApiKeyPanel';
import {
  clearGeminiApiKey,
  getGeminiApiKey,
  saveGeminiApiKey,
} from './geminiKeySession';
import {
  validateMeetingMinutes,
  type MeetingMinutes,
  type MinutesMetadata,
} from './types';

const initialMetadata: MinutesMetadata = {
  khachHang: '',
  noiDung: '',
  thoiGian: '',
  ngay: '',
  diaDiem: '',
  thanhPhan: [{ toChuc: '', nguoi: [{ hoTen: '', chucDanh: '' }] }],
};

export default function MeetingMinutesPage() {
  const [metadata, setMetadata] = useState<MinutesMetadata>(initialMetadata);
  const [rawText, setRawText] = useState('');
  const [content, setContent] = useState<MeetingMinutes | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState(() => getGeminiApiKey());
  const [keyStatus, setKeyStatus] = useState<GeminiKeyStatus>('idle');
  const [keyStatusMessage, setKeyStatusMessage] = useState<string | null>(null);

  const saveApiKey = (value: string) => {
    saveGeminiApiKey(value);
    setApiKey(value.trim());
    setKeyStatus('idle');
    setKeyStatusMessage(null);
  };

  const clearApiKey = () => {
    clearGeminiApiKey();
    setApiKey('');
    setKeyStatus('idle');
    setKeyStatusMessage(null);
  };

  const checkApiKey = async (value: string) => {
    setKeyStatus('checking');
    setKeyStatusMessage(null);
    try {
      const response = await fetch('/api/minutes/gemini/check', {
        method: 'POST',
        headers: { 'X-Gemini-API-Key': value },
      });
      const result = (await response.json().catch(() => null)) as
        | { valid?: boolean; error?: string }
        | null;
      if (!response.ok || !result?.valid) {
        throw new Error(result?.error || 'Không thể xác minh Gemini API key.');
      }
      saveGeminiApiKey(value);
      setApiKey(value.trim());
      setKeyStatus('valid');
      setKeyStatusMessage('Kết nối Gemini thành công. Key đã được lưu trong phiên này.');
    } catch (checkError) {
      setKeyStatus('error');
      setKeyStatusMessage(
        checkError instanceof Error
          ? checkError.message
          : 'Không thể xác minh Gemini API key. Vui lòng thử lại.',
      );
    }
  };

  const generate = async () => {
    if (!apiKey) {
      setError('Vui lòng lưu Gemini API key trước khi tạo biên bản.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/minutes/generate', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-Gemini-API-Key': apiKey,
        },
        body: JSON.stringify({ metadata, rawText }),
      });
      const result = (await response.json()) as { content?: unknown; error?: string };
      if (!response.ok) throw new Error(result.error || 'Không thể tạo biên bản.');
      setContent(validateMeetingMinutes(result.content));
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : 'Không thể tạo biên bản. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  };

  const exportDocx = async () => {
    if (!content) return;
    setExporting(true);
    setExportError(null);
    try {
      const response = await fetch('/api/minutes/export', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(result?.error || 'Không thể xuất file .docx.');
      }

      const disposition = response.headers.get('content-disposition') || '';
      const filename = /filename="([^"]+)"/.exec(disposition)?.[1] || 'bien-ban-hop.docx';
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (exportFailure) {
      setExportError(
        exportFailure instanceof Error
          ? exportFailure.message
          : 'Không thể xuất file .docx. Vui lòng thử lại.',
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-57px)] bg-[#050A1F] p-4 text-white sm:p-6 lg:min-h-screen lg:p-8">
      {content ? (
        <DraftEditor
          content={content}
          onChange={setContent}
          onBack={() => setContent(null)}
          onExport={() => void exportDocx()}
          exporting={exporting}
          exportError={exportError}
        />
      ) : (
        <InputStep
          metadata={metadata}
          rawText={rawText}
          loading={loading}
          error={error}
          canGenerate={Boolean(apiKey)}
          geminiConfiguration={
            <GeminiApiKeyPanel
              savedKey={apiKey}
              status={keyStatus}
              statusMessage={keyStatusMessage}
              onSave={saveApiKey}
              onClear={clearApiKey}
              onCheck={(value) => void checkApiKey(value)}
            />
          }
          onMetadataChange={setMetadata}
          onRawTextChange={setRawText}
          onGenerate={() => void generate()}
        />
      )}
    </main>
  );
}
