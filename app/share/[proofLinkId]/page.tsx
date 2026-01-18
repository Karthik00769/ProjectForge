import { SharedProofContent } from "./shared-proof-content"

export default async function SharedProofPage({ params }: { params: Promise<{ proofLinkId: string }> }) {
  const { proofLinkId } = await params
  return <SharedProofContent proofLinkId={proofLinkId} />
}
