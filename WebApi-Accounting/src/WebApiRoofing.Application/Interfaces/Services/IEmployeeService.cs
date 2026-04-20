using WebApiRoofing.Application.DTOs.Common;
using WebApiRoofing.Application.DTOs.Employees;

namespace WebApiRoofing.Application.Interfaces.Services
{
    public interface IEmployeeService
    {
        Task<ApiResponse<IEnumerable<EmployeeResponse>>>   GetAllAsync();
        Task<ApiResponse<EmployeeResponse>>                GetByIdAsync(int idEmployee);
        Task<ApiResponse<int>>                             CreateAsync(CreateEmployeeRequest request);
        Task<ApiResponse<bool>>                            UpdateAsync(int idEmployee, UpdateEmployeeRequest request);
        Task<ApiResponse<bool>>                            DeleteAsync(int idEmployee);
        Task<ApiResponse<IEnumerable<EmployeeCatalogDto>>> GetCatalogAsync(string tipo);
    }
}
