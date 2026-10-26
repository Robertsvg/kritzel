export async function restorePublicImportMap(): Promise<void> {
    const path = new URL("../deno.json", import.meta.url);
    const config = JSON.parse(await Deno.readTextFile(path));
    config.importMap = "./importmap.json";
    await Deno.writeTextFile(path, JSON.stringify(config, null, 4) + "\n");
}

if (import.meta.main) await restorePublicImportMap();
