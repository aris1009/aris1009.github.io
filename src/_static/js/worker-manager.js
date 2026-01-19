// Worker Manager - Manages web worker instances and communication
// Provides a unified interface for offloading heavy tasks to workers

class WorkerManager {
  constructor() {
    this.workers = new Map();
    this.tasks = new Map();
    this.taskId = 0;
  }

  // Initialize a worker of specified type
  initializeWorker(type) {
    if (this.workers.has(type)) {
      return this.workers.get(type);
    }

    const workerPath = `/js/workers/${type}.js`;
    const worker = new Worker(workerPath);

    worker.onmessage = (event) => this.handleWorkerMessage(type, event);
    worker.onerror = (error) => this.handleWorkerError(type, error);

    this.workers.set(type, worker);
    return worker;
  }

  // Execute a task on a specific worker
  async executeTask(workerType, action, data) {
    const worker = this.initializeWorker(workerType);
    const taskId = ++this.taskId;

    return new Promise((resolve, reject) => {
      this.tasks.set(taskId, { resolve, reject });

      worker.postMessage({
        taskId,
        action,
        data
      });
    });
  }

  // Handle messages from workers
  handleWorkerMessage(workerType, event) {
    const { taskId, success, result, error } = event.data;

    if (this.tasks.has(taskId)) {
      const { resolve, reject } = this.tasks.get(taskId);
      this.tasks.delete(taskId);

      if (success) {
        resolve(result);
      } else {
        reject(new Error(error));
      }
    }
  }

  // Handle worker errors
  handleWorkerError(workerType, error) {
    console.error(`Worker ${workerType} error:`, error);

    // Find and reject all pending tasks for this worker
    for (const [taskId, { reject }] of this.tasks) {
      reject(new Error(`Worker ${workerType} failed: ${error.message}`));
      this.tasks.delete(taskId);
    }
  }

  // Terminate a specific worker
  terminateWorker(type) {
    const worker = this.workers.get(type);
    if (worker) {
      worker.terminate();
      this.workers.delete(type);
    }
  }

  // Terminate all workers
  terminateAll() {
    for (const [type, worker] of this.workers) {
      worker.terminate();
    }
    this.workers.clear();
    this.tasks.clear();
  }

  // Get worker status
  getWorkerStatus(type) {
    return this.workers.has(type);
  }

  // Get all active workers
  getActiveWorkers() {
    return Array.from(this.workers.keys());
  }

  // Get pending tasks count
  getPendingTasksCount() {
    return this.tasks.size;
  }
}

// Export singleton instance
const workerManager = new WorkerManager();

// Export convenience methods
export const initializeWorker = (type) => workerManager.initializeWorker(type);
export const executeTask = (workerType, action, data) => workerManager.executeTask(workerType, action, data);
export const terminateWorker = (type) => workerManager.terminateWorker(type);
export const terminateAllWorkers = () => workerManager.terminateAll();
export const getWorkerStatus = (type) => workerManager.getWorkerStatus(type);
export const getActiveWorkers = () => workerManager.getActiveWorkers();
export const getPendingTasksCount = () => workerManager.getPendingTasksCount();

export default workerManager;