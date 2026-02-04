export async function createATA(owner) {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    ata: `ATA_${owner}`
  };
}
