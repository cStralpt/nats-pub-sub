import { connect, StringCodec } from "nats";

const sc = StringCodec();
const jobSubName = "your-jobs";
const jobQueueName = "your-queue";

type JobMessage = {
  name: string;
  payload?: Record<string, unknown>;
};

function divide(a: number, b: number) {
  return a / b;
}

function sum(a: number, b: number) {
  return a + b;
}

function handleJob(job: JobMessage) {
  switch (job.name) {
    case "devide 12 with 2": {
      const { a = 12, b = 2 } = (job.payload ?? {}) as {
        a?: number;
        b?: number;
      };
      return divide(a, b);
    }
    case "sum 90+1": {
      const { a = 90, b = 1 } = (job.payload ?? {}) as {
        a?: number;
        b?: number;
      };
      return sum(a, b);
    }
    default:
      throw new Error(`unknown job: ${job.name}`);
  }
}

async function startWorker() {
  const nc = await connect({ servers: "localhost:4222" });
  const sub = nc.subscribe(jobSubName, { queue: jobQueueName });

  console.log("Worker started:", process.pid);
  (async () => {
    for await (const m of sub) {
      const raw = sc.decode(m.data);
      let job: JobMessage;
      try {
        const parsed = JSON.parse(raw) as JobMessage;
        job = parsed?.name ? parsed : { name: raw };
      } catch {
        job = { name: raw };
      }
      console.log(`[${process.pid}] processing: ${job.name}`);
      try {
        const result = handleJob(job);
        console.log(`[${process.pid}] result: ${result}`);
      } catch (err) {
        console.error(`[${process.pid}] error handling job: ${job.name}`, err);
      }
    }
  })();

  return nc;
}

async function publishJobs(nc:any) {
  const jobs: JobMessage[] = [
    { name: "devide 12 with 2", payload: { a: 12, b: 2 } },
    { name: "sum 90+1", payload: { a: 90, b: 1 } },
  ];

  for (const job of jobs) {
    nc.publish(jobSubName, sc.encode(JSON.stringify(job)));
    console.log("Sent job:", job.name, job.payload ?? {});
  }
  await nc.flush();
}

async function main() {
  const workerConn = await startWorker();
  await publishJobs(workerConn);

  // Let the worker finish then close
  setTimeout(async () => {
    await workerConn.drain();
    console.log("Closed connection");
  }, 2000);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});