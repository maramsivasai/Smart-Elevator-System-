/**
 * Controls the elevator system, managing movements and tracking metrics
 */
public class ElevatorController {
    private Elevator elevator;
    private Scheduler scheduler;
    private long totalServiceTime;
    private long startTime;

    public ElevatorController() {
        this.elevator = new Elevator();
        this.scheduler = new Scheduler();
        this.totalServiceTime = 0;
        this.startTime = System.currentTimeMillis();
    }

    public void requestFloor(int floorNumber) {
        if (floorNumber < 1 || floorNumber > Elevator.getTotalFloors()) {
            System.out.println("❌ Invalid floor: " + floorNumber);
            return;
        }
        Request request = new Request(floorNumber);
        scheduler.addRequest(request);
        System.out.println("✓ Request added: " + request);
    }

    public void moveElevator() {
        if (!scheduler.hasRequests()) {
            System.out.println("No pending requests.");
            return;
        }

        Request currentRequest = scheduler.getNextRequest();
        int targetFloor = currentRequest.getFloorNumber();
        int currentFloor = elevator.getCurrentFloor();

        if (currentFloor == targetFloor) {
            System.out.println("Already at " + targetFloor + ". Skipping.");
            return;
        }

        System.out.println("\n--- Moving Elevator ---");
        System.out.println("From Floor " + currentFloor + " to Floor " + targetFloor);

        // Show step-by-step movement
        moveStepByStep(currentFloor, targetFloor);

        elevator.moveToFloor(targetFloor);
        long waitingTime = currentRequest.getWaitingTime();
        totalServiceTime += waitingTime;

        System.out.println("✓ Arrived at Floor " + targetFloor);
        System.out.println("  Waiting time: " + waitingTime + " ms");
        System.out.println(elevator.toString());
    }

    private void moveStepByStep(int from, int to) {
        if (from < to) {
            for (int i = from + 1; i <= to; i++) {
                System.out.println("  ⬆ Floor " + i);
                try { Thread.sleep(300); } catch (InterruptedException e) { }
            }
        } else {
            for (int i = from - 1; i >= to; i--) {
                System.out.println("  ⬇ Floor " + i);
                try { Thread.sleep(300); } catch (InterruptedException e) { }
            }
        }
    }

    public void processAllRequests() {
        System.out.println("=== Starting Elevator Service ===\n");
        while (scheduler.hasRequests()) {
            moveElevator();
        }
        displayFinalStats();
    }

    public void displayStatus() {
        System.out.println("\n--- Elevator Status ---");
        System.out.println(elevator.toString());
        System.out.println(scheduler.toString());
        System.out.println("Total Service Time: " + totalServiceTime + " ms");
    }

    public void displayFinalStats() {
        long totalTime = System.currentTimeMillis() - startTime;
        System.out.println("\n=== Final Statistics ===");
        System.out.println("Current Floor: " + elevator.getCurrentFloor());
        System.out.println("Floors Visited: " + elevator.getFloorsVisited());
        System.out.println("Total Movement: " + elevator.getTotalMovement() + " floors");
        System.out.println("Total Waiting Time: " + totalServiceTime + " ms");
        System.out.println("Total Execution Time: " + totalTime + " ms");
    }
}
