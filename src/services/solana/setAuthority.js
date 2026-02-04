export async function setAuthority(mode) {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { status: 'set', mode };
}
