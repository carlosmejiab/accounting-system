namespace WebApiRoofing.Application.DTOs.Response
{
    public class ServiceResponse
    {
        public int IdService { get; set; }
        public string Name { get; set; } = string.Empty;
        public int IdTypeClient { get; set; }
        public string ClientType { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? Descripcion { get; set; }
    }
}