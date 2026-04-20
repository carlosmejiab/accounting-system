namespace WebApiRoofing.Application.DTOs.Documents
{
    public class CreateFolderRequest
    {
        public string  Name        { get; set; } = string.Empty;
        public int?    IdClient    { get; set; }
        public int?    IdTask      { get; set; }
        public bool    IsPrincipal { get; set; }
        public string? ParentRuta  { get; set; }
    }
}
