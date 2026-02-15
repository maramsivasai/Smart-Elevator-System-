import java.util.Scanner;

/**
 * Main entry point for the Elevator Simulator
 */
public class Main {
    public static void main(String[] args) {
        ElevatorController controller = new ElevatorController();
        Scanner scanner = new Scanner(System.in);

        System.out.println("╔════════════════════════════════════╗");
        System.out.println("║   ELEVATOR SIMULATOR (10 Floors)   ║");
        System.out.println("║   FCFS Scheduling Algorithm        ║");
        System.out.println("╚════════════════════════════════════╝\n");

        while (true) {
            System.out.println("\nOptions:");
            System.out.println("(1-10) Request a floor");
            System.out.println("S      View status");
            System.out.println("P      Process all requests");
            System.out.println("E      Exit");
            System.out.print("Choice: ");

            String input = scanner.nextLine().trim().toUpperCase();

            try {
                // Try to parse as floor number first
                int floor = Integer.parseInt(input);
                controller.requestFloor(floor);
            } catch (NumberFormatException e) {
                // Handle menu options
                if (input.equals("S")) {
                    controller.displayStatus();
                } else if (input.equals("P")) {
                    controller.processAllRequests();
                    break;
                } else if (input.equals("E")) {
                    System.out.println("Exiting...");
                    break;
                } else {
                    System.out.println("❌ Invalid input. Enter floor (1-10), S (status), P (process), or E (exit).");
                }
            }
        }

        scanner.close();
    }
}
