namespace WebApiRoofing.Application.DTOs.Events
{
    public class CreateEventRequest
    {
        public string Name { get; set; } = string.Empty;
        public DateTime StartDateTime { get; set; }
        public DateTime DueDateTime { get; set; }
        public int IdStatusEvent { get; set; }
        public int IdActivityType { get; set; }
        public int IdLocation { get; set; }
        public int IdPriority { get; set; }
        public int? IdTask { get; set; }
        public int? IdClient { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public int? IdFrequency { get; set; }
        public List<int> ParticipantIds { get; set; } = new();
    }

    public class UpdateEventRequest
    {
        public string Name { get; set; } = string.Empty;
        public DateTime StartDateTime { get; set; }
        public DateTime DueDateTime { get; set; }
        public int IdStatusEvent { get; set; }
        public int IdActivityType { get; set; }
        public int IdLocation { get; set; }
        public int IdPriority { get; set; }
        public int? IdTask { get; set; }
        public int? IdClient { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public int? IdFrequency { get; set; }
        public List<int> ParticipantIds { get; set; } = new();
    }

    public class EventResponse
    {
        public int IdEvent { get; set; }
        public int? IdStatusEvent { get; set; }
        public int? IdActivityType { get; set; }
        public int? IdLocation { get; set; }
        public int? IdPriority { get; set; }
        public int? IdTask { get; set; }
        public int? IdClient { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime StartDateTime { get; set; }
        public DateTime DueDateTime { get; set; }
        public string? Description { get; set; }
        public string? State { get; set; }
        public int? IdFrequency { get; set; }
        public int? IdEmployeeCreate { get; set; }
        // Joined display fields
        public string? Status { get; set; }
        public string? ActivityType { get; set; }
        public string? Location { get; set; }
        public string? Priority { get; set; }
        public string? TaskName { get; set; }
        public string? ClientName { get; set; }
    }

    public class EventParticipantDto
    {
        public int IdEmployee { get; set; }
        public string FullName { get; set; } = string.Empty;
        public bool IsSelected { get; set; }
    }

    public class EventCatalogDto
    {
        public int IdTabla { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    // Used by FullCalendar (React)
    public class EventCalendarDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Start { get; set; } = string.Empty;   // ISO 8601
        public string End { get; set; } = string.Empty;     // ISO 8601
        public string? Description { get; set; }
        public string? ClientName { get; set; }
        public string? TaskName { get; set; }
        public string? ActivityType { get; set; }
        public string? Status { get; set; }
        public string Color { get; set; } = "#f59e0b";      // yellow-ish, matches original
        public string TextColor { get; set; } = "#1a1a2e";
    }
}
