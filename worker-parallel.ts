import { connect, StringCodec } from "nats";

const sc = StringCodec();

async function main() {
  const nc = await connect({ servers: "localhost:4222" });

  const sub = nc.subscribe("jobs");

  console.log("Worker with async processing started");

  for await (const m of sub) {
    const job = sc.decode(m.data);
    console.log("Received:", job);

    // Process job asynchronously (don’t await)
    processJob(job);
  }
}

async function processJob(job: string) {
  console.log("Start job:", job);
  await new Promise(r => setTimeout(r, 2000)); // simulate work
  console.log("Done job:", job);
}

main();
