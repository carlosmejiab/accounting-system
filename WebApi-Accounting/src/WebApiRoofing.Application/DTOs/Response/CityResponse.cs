namespace WebApiRoofing.Application.DTOs.Response
{
    public class CityResponse
    {
        public int IdCity { get; set; }
        public string NombreCity { get; set; } = string.Empty;
        public int IdState { get; set; }
        public string NameState { get; set; } = string.Empty;
    }
}