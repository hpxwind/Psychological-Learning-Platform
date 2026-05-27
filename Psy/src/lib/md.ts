import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({ breaks: true });

// 渲染 Markdown，同时过滤原始 HTML 标签和 XSS 攻击
export const renderMd = (text: string): string => {
  if (!text) return '';
  try {
    const cleanText = text.replace(/<[^>]*>/g, '');
    const html = marked.parse(cleanText) as string;
    return DOMPurify.sanitize(html);
  } catch {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
};
