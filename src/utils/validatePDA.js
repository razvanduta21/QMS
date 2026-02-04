export function validatePDA(address) {
  return Boolean(address && address.length > 10);
}
