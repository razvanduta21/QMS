export function validateMultisig(addresses = []) {
  return addresses.length >= 2;
}
