import { TemplatePreviewContent } from "./template-preview-content"

export default async function TemplatePreviewPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params
  return <TemplatePreviewContent templateId={templateId} />
}
