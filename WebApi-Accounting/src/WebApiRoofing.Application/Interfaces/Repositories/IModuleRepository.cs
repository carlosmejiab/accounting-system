namespace WebApiRoofing.Application.Interfaces.Repositories;

/// <summary>
/// Interface del repositorio de módulos
/// </summary>
public interface IModuleRepository
{
    Task<List<dynamic>> GetAllAsync();
}