import { TemplateTaskContent } from "./template-task-content"

export default async function TemplateTaskPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params
  return <TemplateTaskContent templateId={templateId} />
}
