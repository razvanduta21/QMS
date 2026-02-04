export async function revokeAuthority() {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { status: 'revoked' };
}
