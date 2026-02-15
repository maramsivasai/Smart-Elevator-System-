/**
 * Represents the elevator unit with current position and metrics
 */
public class Elevator {
    private static final int TOTAL_FLOORS = 10;
    private static final int GROUND_FLOOR = 1;
    
    private int currentFloor;
    private int totalMovement;
    private int floorsVisited;

    public Elevator() {
        this.currentFloor = GROUND_FLOOR;
        this.totalMovement = 0;
        this.floorsVisited = 0;
    }

    public void moveToFloor(int targetFloor) {
        if (targetFloor < GROUND_FLOOR || targetFloor > TOTAL_FLOORS) {
            throw new IllegalArgumentException("Invalid floor: " + targetFloor);
        }
        
        int distance = Math.abs(targetFloor - currentFloor);
        totalMovement += distance;
        currentFloor = targetFloor;
        floorsVisited++;
    }

    public int getCurrentFloor() {
        return currentFloor;
    }

    public int getTotalMovement() {
        return totalMovement;
    }

    public int getFloorsVisited() {
        return floorsVisited;
    }

    public static int getTotalFloors() {
        return TOTAL_FLOORS;
    }

    @Override
    public String toString() {
        return "Elevator at Floor " + currentFloor + " | Total Movement: " + totalMovement + " floors";
    }
}
