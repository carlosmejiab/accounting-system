using System.ComponentModel.DataAnnotations;

namespace WebApiRoofing.Application.DTOs.Tasks
{
    // ─────────────────────────────────────────────────────────────────────────
    //  LIST ITEM DTO
    // ─────────────────────────────────────────────────────────────────────────
    public class TaskListItemDto
    {
        public int       IdTask          { get; set; }
        public string?   Name            { get; set; }
        public string?   ClientName      { get; set; }
        public string?   ClientAccount   { get; set; }
        public string?   TypeTask        { get; set; }
        public string?   StatusName      { get; set; }
        public string?   PriorityName    { get; set; }
        public string?   AssignedTo      { get; set; }
        public string?   NameGroup       { get; set; }
        public int?      FiscalYear      { get; set; }
        public DateTime? StartDateTime   { get; set; }
        public DateTime? DueDateTime     { get; set; }
        public string    State           { get; set; } = "1";
        public DateTime? CreationDate    { get; set; }
        public DateTime? ModificationDate{ get; set; }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  DETAIL RESPONSE
    // ─────────────────────────────────────────────────────────────────────────
    public class TaskDetailResponse
    {
        public int     IdTask           { get; set; }
        public string? Name             { get; set; }
        public int?    IdClient         { get; set; }
        public int?    IdGroup          { get; set; }
        public int?    IdTypeTask       { get; set; }
        public int?    IdEmployee       { get; set; }
        public int?    IdStatus         { get; set; }
        public int?    IdLocation       { get; set; }
        public int?    IdContact        { get; set; }
        public int?    IdPriority       { get; set; }
        public int?    IdClientAccount  { get; set; }
        public int?    IdParentTask     { get; set; }

        public string? ClientName        { get; set; }
        public string? TypeTask          { get; set; }
        public string? EmployeeName      { get; set; }
        public string? StatusName        { get; set; }
        public string? PriorityName      { get; set; }
        public string? Location          { get; set; }
        public string? FiscalYearStr     { get; set; }
        public string? CreatedByEmployee { get; set; }
        public string? NameGroup         { get; set; }
        public string? FirstNameContact  { get; set; }
        public string? ClienteAccount    { get; set; }

        public DateTime? StartDateTime    { get; set; }
        public DateTime? DueDateTime      { get; set; }
        public int?      Estimate         { get; set; }
        public int       Dia              { get; set; }
        public int       Horas            { get; set; }
        public int       Minutos          { get; set; }
        public string?   Description      { get; set; }
        public string    State            { get; set; } = "1";
        public bool      IsActive         => State == "1";
        public int?      FiscalYear       { get; set; }
        public DateTime? PolicyExpDate    { get; set; }
        public DateTime? DatePaid         { get; set; }
        public DateTime? CreationDate     { get; set; }
        public DateTime? ModificationDate { get; set; }

        // Multi-select (loaded separately via participants/supervisors/appointments endpoints)
        public List<EmployeeSelectionDto> Participants  { get; set; } = new();
        public List<EmployeeSelectionDto> Supervisors   { get; set; } = new();
        public List<EmployeeSelectionDto> Appointments  { get; set; } = new();
        public List<TaskCommentResponse>  Comments      { get; set; } = new();
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  CREATE REQUEST
    // ─────────────────────────────────────────────────────────────────────────
    public class CreateTaskRequest
    {
        [Required] [MaxLength(150)]
        public string Name      { get; set; } = string.Empty;
        [Required] public int   IdClient    { get; set; }
        [Required] public int   IdTypeTask  { get; set; }

        public int?      IdGroup          { get; set; }
        public int?      IdEmployee       { get; set; }
        public int?      IdStatus         { get; set; }
        public int?      IdLocation       { get; set; }
        public int?      IdContact        { get; set; }
        public int?      IdPriority       { get; set; }
        public int?      IdClientAccount  { get; set; }
        public int?      IdParentTask     { get; set; }

        public DateTime? StartDateTime    { get; set; }
        public DateTime? DueDateTime      { get; set; }

        public int       Dia              { get; set; }
        public int       Horas            { get; set; }
        public int       Minutos          { get; set; }

        public string?   Description      { get; set; }
        public int?      FiscalYear       { get; set; }
        public DateTime? PolicyExpDate    { get; set; }
        public DateTime? DatePaid         { get; set; }
        public bool      IsActive         { get; set; } = true;

        public List<int> ParticipantIds   { get; set; } = new();
        public List<int> SupervisorIds    { get; set; } = new();
        public List<int> AppointmentIds   { get; set; } = new();
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  UPDATE REQUEST
    // ─────────────────────────────────────────────────────────────────────────
    public class UpdateTaskRequest
    {
        [Required] [MaxLength(150)]
        public string Name      { get; set; } = string.Empty;
        [Required] public int   IdClient    { get; set; }
        [Required] public int   IdTypeTask  { get; set; }

        public int?      IdGroup          { get; set; }
        public int?      IdEmployee       { get; set; }
        public int?      IdStatus         { get; set; }
        public int?      IdLocation       { get; set; }
        public int?      IdContact        { get; set; }
        public int?      IdPriority       { get; set; }
        public int?      IdClientAccount  { get; set; }
        public int?      IdParentTask     { get; set; }

        public DateTime? StartDateTime    { get; set; }
        public DateTime? DueDateTime      { get; set; }

        public int       Dia              { get; set; }
        public int       Horas            { get; set; }
        public int       Minutos          { get; set; }

        public string?   Description      { get; set; }  // becomes new comment
        public int?      FiscalYear       { get; set; }
        public DateTime? PolicyExpDate    { get; set; }
        public DateTime? DatePaid         { get; set; }
        public bool      IsActive         { get; set; } = true;

        public List<int> ParticipantIds   { get; set; } = new();
        public List<int> SupervisorIds    { get; set; } = new();
        public List<int> AppointmentIds   { get; set; } = new();
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  SEARCH
    // ─────────────────────────────────────────────────────────────────────────
    public class TaskSearchRequest
    {
        /// <summary>"numbers" | "dates" | "period" | "client"</summary>
        public string    Mode      { get; set; } = string.Empty;
        public string?   Numbers   { get; set; }
        public DateTime? DateFrom  { get; set; }
        public DateTime? DateTo    { get; set; }
        public int?      PeriodId  { get; set; }
        public int?      ClientId  { get; set; }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  VALIDATION
    // ─────────────────────────────────────────────────────────────────────────
    public class TaskExistsRequest
    {
        public string Name       { get; set; } = string.Empty;
        public int    IdTypeTask  { get; set; }
        public int    IdClient    { get; set; }
        public int?   IdTask      { get; set; }
    }
}
