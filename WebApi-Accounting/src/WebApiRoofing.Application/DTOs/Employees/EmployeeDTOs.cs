namespace WebApiRoofing.Application.DTOs.Employees
{
    public class EmployeeResponse
    {
        public int    IdEmployee    { get; set; }
        public string FirstName     { get; set; } = string.Empty;
        public string LastName      { get; set; } = string.Empty;
        public string FullName      { get; set; } = string.Empty;
        public string? Email        { get; set; }
        public string? MobilePhone  { get; set; }
        public int?   IdLocation    { get; set; }
        public int?   IdPosition    { get; set; }
        public string? LocationName { get; set; }
        public string? PositionName { get; set; }
        public string? State        { get; set; }
    }

    public class CreateEmployeeRequest
    {
        public string  FirstName   { get; set; } = string.Empty;
        public string  LastName    { get; set; } = string.Empty;
        public string? Email       { get; set; }
        public string? MobilePhone { get; set; }
        public int?    IdLocation  { get; set; }
        public int?    IdPosition  { get; set; }
    }

    public class UpdateEmployeeRequest
    {
        public string  FirstName   { get; set; } = string.Empty;
        public string  LastName    { get; set; } = string.Empty;
        public string? Email       { get; set; }
        public string? MobilePhone { get; set; }
        public int?    IdLocation  { get; set; }
        public int?    IdPosition  { get; set; }
        public bool    IsActive    { get; set; } = true;
    }

    public class EmployeeCatalogDto
    {
        public int    IdTabla     { get; set; }
        public string Description { get; set; } = string.Empty;
    }
}
