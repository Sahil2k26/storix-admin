// app/api/preview-store/route.ts (or /api/preview-store.ts depending on your routing setup)
import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

export async function POST(req: Request) {
    const { StoreApiUrl, storeName } = await req.json();

    if (!StoreApiUrl || !storeName) {
        return NextResponse.json({ error: "Missing store info" }, { status: 400 });
    }
    console.log(StoreApiUrl, storeName);


    const port = 3001; // You could make this dynamic with a port allocator
    //const containerName = `store-preview-${storeName.slice(0, 6)}`;
    const cmd = `docker run -d -e NEXT_PUBLIC_API_URL=${StoreApiUrl} -e StoreName="${storeName}" -p ${port}:3001 dev862/ecommerce-storefront-template:latest`;

    try {
        console.log("Executing:", cmd);
        const { stdout, stderr } = await execPromise(cmd);
        console.log("Docker output:", stdout);
        if (stderr) console.error("Docker error output:", stderr);
        const containerId = stdout.trim();
        setTimeout(() => {
            exec(`docker stop ${containerId}`, (err, out, errOut) => {
                if (err) {
                    console.error("Failed to stop container:", errOut || err.message);
                } else {
                    console.log(`Stopped container ${containerId}`);
                }
            });
        }, 5 * 60 * 1000); // 2 minutes
        return NextResponse.json({ url: `http://localhost:${port}` });
    } catch (err: unknown) {
        console.error("Docker failed:", err);
        return NextResponse.json({ error: "Failed to run preview container", details: err }, { status: 500 });
    }

}
