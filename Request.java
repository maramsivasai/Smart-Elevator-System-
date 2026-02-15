/**
 * Represents a floor request in the elevator system
 */
public class Request {
    private int floorNumber;
    private long requestTime;

    public Request(int floorNumber) {
        this.floorNumber = floorNumber;
        this.requestTime = System.currentTimeMillis();
    }

    public int getFloorNumber() {
        return floorNumber;
    }

    public long getRequestTime() {
        return requestTime;
    }

    public long getWaitingTime() {
        return System.currentTimeMillis() - requestTime;
    }

    @Override
    public String toString() {
        return "Floor " + floorNumber;
    }
}
