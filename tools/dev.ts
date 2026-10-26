import { restorePublicImportMap } from "./reset-config.ts";
const port = Deno.args[0] ?? "8080";
if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
    throw new Error("Provide a port between 1 and 65535");
}

try {
    const child = new Deno.Command(Deno.execPath(), {
        args: [
            "run",
            "-A",
            "--import-map=importmap.json",
            "https://cdn.unyt.org/uix@0.4.39/run.ts",
            "--port",
            port,
            "--allow-none",
        ],
        cwd: new URL("../", import.meta.url),
        stdin: "inherit",
        stdout: "inherit",
        stderr: "inherit",
    }).spawn();
    const status = await child.status;
    if (!status.success) Deno.exitCode = status.code;
} finally {
    // UIX rewrites this field to a generated lock map during startup.
    await restorePublicImportMap();
}
