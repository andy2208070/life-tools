import { useState, useEffect } from 'react';
import { Card, Upload, Button, Select, Radio, Progress, Typography, Space } from 'antd';
import { InboxOutlined, PlayCircleOutlined } from '@ant-design/icons';
import Tesseract from 'tesseract.js';

const { Dragger } = Upload;
const { Title, Paragraph } = Typography;
const { Option } = Select;

export default function OCRPage() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewURL, setPreviewURL] = useState<string | null>(null);
    const [language, setLanguage] = useState<string>('chi_tra+eng');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState<{ status: string; progress: number } | null>(null);
    const [resultText, setResultText] = useState<string>('');
    const [orientationMode, setOrientationMode] = useState<number>(3);

    const handleUploadChange = (info: any) => {
        // antd Upload wraps original file in originFileObj
        const file = info.file?.originFileObj || info.file;
        if (file) {
            setImageFile(file);
            setPreviewURL(URL.createObjectURL(file));
            setResultText('');
            setProgress(null);
        }
    };

    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (items) {
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                        const file = items[i].getAsFile();
                        if (file) {
                            handleUploadChange({ file });
                        }
                        break;
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);

    const handleProcessOCR = async () => {
        if (!imageFile) return;

        setIsProcessing(true);
        setResultText('');

        try {
            const worker = await Tesseract.createWorker(language, 1, {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setProgress({ status: 'Recognizing text...', progress: Math.round(m.progress * 100) });
                    } else {
                        setProgress({ status: m.status, progress: 0 });
                    }
                }
            });

            await worker.setParameters({
                tessedit_pageseg_mode: orientationMode as any,
            });

            const { data: { text } } = await worker.recognize(imageFile);
            setResultText(text);
            await worker.terminate();
        } catch (error) {
            console.error(error);
            setResultText('OCR Processing Failed. Please try a different image or layout mode.');
        } finally {
            setIsProcessing(false);
            setProgress(null);
        }
    };

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <Title level={2} className="!mb-1">OCR Text Extraction</Title>
                    <Paragraph className="text-gray-400">
                        Upload an image to extract Chinese and English text automatically.
                    </Paragraph>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[600px]">
                <Card className="h-full flex flex-col shadow-xl border-gray-800 bg-[#141414] overflow-auto" styles={{ body: { display: 'flex', flexDirection: 'column', flex: 1, padding: '24px' } }}>
                    <Space direction="vertical" size="large" className="w-full">
                        <Dragger
                            accept="image/*"
                            showUploadList={false}
                            beforeUpload={() => false}
                            onChange={handleUploadChange}
                            className="bg-[#1f1f1f] border-gray-700 hover:border-indigo-500 transition-colors"
                        >
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined className="text-indigo-400" />
                            </p>
                            <p className="ant-upload-text text-gray-300">Click or drag image to this area to upload</p>
                            <p className="ant-upload-hint text-gray-500">
                                Supports common image formats like PNG, JPG, JPEG.
                            </p>
                        </Dragger>

                        {previewURL && (
                            <div className="rounded-lg overflow-hidden border border-gray-700 bg-black flex justify-center max-h-64 mt-4">
                                <img src={previewURL} alt="Preview" className="object-contain w-full h-full max-h-64" />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                                <div className="text-sm text-gray-400 mb-2">Language</div>
                                <Select value={language} onChange={setLanguage} className="w-full">
                                    <Option value="chi_tra+eng">Traditional ZH + EN</Option>
                                    <Option value="chi_sim+eng">Simplified ZH + EN</Option>
                                    <Option value="eng">English Only</Option>
                                    <Option value="chi_tra">Traditional ZH Only</Option>
                                    <Option value="chi_sim">Simplified ZH Only</Option>
                                </Select>
                            </div>

                            <div>
                                <div className="text-sm text-gray-400 mb-2">Text Layout</div>
                                <Radio.Group value={orientationMode} onChange={(e) => setOrientationMode(e.target.value)} className="w-full flex">
                                    <Radio.Button value={3} className="flex-1 text-center">Auto</Radio.Button>
                                    <Radio.Button value={6} className="flex-1 text-center">Horizontal</Radio.Button>
                                    <Radio.Button value={5} className="flex-1 text-center">Vertical</Radio.Button>
                                </Radio.Group>
                            </div>
                        </div>

                        <Button
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            size="large"
                            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 border-none"
                            onClick={handleProcessOCR}
                            loading={isProcessing}
                            disabled={!imageFile}
                        >
                            {isProcessing ? 'Processing Image...' : 'Extract Text'}
                        </Button>

                        {progress && (
                            <div className="mt-4">
                                <span className="text-sm text-gray-400 mb-1 block">{progress.status}</span>
                                <Progress percent={progress.progress} strokeColor="#646cff" trailColor="#222" />
                            </div>
                        )}
                    </Space>
                </Card>

                <Card
                    className="h-full shadow-xl border-gray-800 bg-[#141414] overflow-hidden"
                    title={<span className="text-gray-200">Extraction Result</span>}
                    styles={{ body: { height: 'calc(100% - 57px)', padding: 0 } }}
                >
                    {resultText ? (
                        <textarea
                            className="w-full h-full bg-[#141414] text-gray-200 p-6 resize-none outline-none border-none"
                            value={resultText}
                            readOnly
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-600 p-6 text-center">
                            The extracted text will appear here. Upload an image and click 'Extract Text' to begin.
                        </div>
                    )}
                </Card>
            </div>

        </div>
    );
}
