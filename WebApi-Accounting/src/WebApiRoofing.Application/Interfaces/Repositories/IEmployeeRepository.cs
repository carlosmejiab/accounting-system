using WebApiRoofing.Application.DTOs.Employees;

namespace WebApiRoofing.Application.Interfaces.Repositories
{
    public interface IEmployeeRepository
    {
        Task<IEnumerable<EmployeeResponse>>    GetAllAsync();
        Task<EmployeeResponse?>                GetByIdAsync(int idEmployee);
        Task<int>                              CreateAsync(CreateEmployeeRequest request);
        Task                                   UpdateAsync(int idEmployee, UpdateEmployeeRequest request);
        Task                                   DeleteAsync(int idEmployee);
        Task<IEnumerable<EmployeeCatalogDto>>  GetCatalogAsync(string tipo);
    }
}
