namespace WebApiRoofing.Application.DTOs.Tasks
{
    public class TypeTaskResponse
    {
        public int    IdTypeTask { get; set; }
        public string Name       { get; set; } = string.Empty;
    }

    public class TaskStatusResponse
    {
        public int    IdTabla      { get; set; }
        public string Description  { get; set; } = string.Empty;
    }

    public class PriorityResponse
    {
        public int    IdTabla     { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    public class TaskClientResponse
    {
        public int    IdClient { get; set; }
        public string Name     { get; set; } = string.Empty;
    }

    public class TaskContactResponse
    {
        public int    IdContact  { get; set; }
        public string FirstName  { get; set; } = string.Empty;
    }

    public class TaskClientAccountResponse
    {
        public int    IdClientAccount { get; set; }
        public string ClienteAccount  { get; set; } = string.Empty;
    }

    public class GroupResponse
    {
        public int    IdGroup   { get; set; }
        public string NameGroup { get; set; } = string.Empty;
    }

    /// <summary>Employee item for dropdown (create mode multi-selects)</summary>
    public class EmployeeDropdownResponse
    {
        public int    IdEmployee { get; set; }
        public string FullName   { get; set; } = string.Empty;
    }

    /// <summary>Employee item with assignment state (edit mode multi-selects)</summary>
    public class EmployeeSelectionDto
    {
        public int    IdEmployee { get; set; }
        public string FullName   { get; set; } = string.Empty;
        public bool   State      { get; set; }   // true = currently assigned
    }

    public class LocationItemResponse
    {
        public int    IdTabla     { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    public class FiscalYearItemResponse
    {
        public int    IdTabla     { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    public class PeriodResponse
    {
        public int    IdTabla     { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    public class TypeTaskVisibilityResponse
    {
        public bool ShowApptWith    { get; set; }
        public bool ShowDatePaid    { get; set; }
    }
}
