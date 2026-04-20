namespace WebApiRoofing.Application.DTOs.Tasks
{
    public class TrackingDto
    {
        public int    IdTracking       { get; set; }
        public int    IdTask           { get; set; }
        public string Name             { get; set; } = string.Empty;
        public DateTime? StartDateTime { get; set; }
        public DateTime? DueDateTime   { get; set; }
        public int    DurationTime     { get; set; }
        public int    TimeWork         { get; set; }
        public DateTime? TrackingStar  { get; set; }
        public int?   IdStatusTracking { get; set; }
        public string Status           { get; set; } = string.Empty;
        public int?   IdEmployee       { get; set; }
        public string EmployeeName     { get; set; } = string.Empty;
        public string State            { get; set; } = "1";
    }

    public class CreateTrackingRequest
    {
        public int    IdTask           { get; set; }
        public string Name             { get; set; } = string.Empty;
        public DateTime? StartDateTime { get; set; }
        public DateTime? DueDateTime   { get; set; }
        public int?   IdEmployee       { get; set; }
        public int?   IdStatusTracking { get; set; }
    }

    public class TrackingTimerRequest
    {
        public int SecondsWorked { get; set; }
    }

    public class TrackingStatusDto
    {
        public int    IdTabla      { get; set; }
        public string Description  { get; set; } = string.Empty;
    }

    public class TrackingEmployeeDto
    {
        public int    IdEmployee { get; set; }
        public string FullName   { get; set; } = string.Empty;
    }
}
