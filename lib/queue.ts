// Simple in-process queue — no Redis needed
// For production, use BullMQ with Redis

type JobProcessor = (data: any) => Promise<any>;

const queue: { data: any; processor: JobProcessor }[] = [];
let processing = false;

async function processNext() {
  if (processing || queue.length === 0) return;
  processing = true;

  while (queue.length > 0) {
    const job = queue.shift();
    if (job) {
      try {
        await job.processor(job.data);
      } catch (err) {
        console.error('Job failed:', err);
      }
    }
  }

  processing = false;
}

export const auditQueue = {
  async add(_name: string, data: any, processor: JobProcessor) {
    queue.push({ data, processor });
    processNext();
  },
};
