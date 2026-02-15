import java.util.LinkedList;
import java.util.Queue;

/**
 * Scheduler using First-Come-First-Served (FCFS) algorithm
 */
public class Scheduler {
    private Queue<Request> requestQueue;

    public Scheduler() {
        this.requestQueue = new LinkedList<>();
    }

    public void addRequest(Request request) {
        requestQueue.add(request);
    }

    public Request getNextRequest() {
        return requestQueue.poll();
    }

    public boolean hasRequests() {
        return !requestQueue.isEmpty();
    }

    public int getPendingRequestCount() {
        return requestQueue.size();
    }

    @Override
    public String toString() {
        return "Pending Requests: " + requestQueue.size();
    }
}
