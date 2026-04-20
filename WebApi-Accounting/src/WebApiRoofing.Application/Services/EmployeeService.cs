using WebApiRoofing.Application.DTOs.Common;
using WebApiRoofing.Application.DTOs.Employees;
using WebApiRoofing.Application.Interfaces.Repositories;
using WebApiRoofing.Application.Interfaces.Services;

namespace WebApiRoofing.Application.Services
{
    public class EmployeeService : IEmployeeService
    {
        private readonly IEmployeeRepository _repo;

        public EmployeeService(IEmployeeRepository repo)
        {
            _repo = repo;
        }

        public async Task<ApiResponse<IEnumerable<EmployeeResponse>>> GetAllAsync()
        {
            try
            {
                var data = await _repo.GetAllAsync();
                return ApiResponse<IEnumerable<EmployeeResponse>>.SuccessResponse(data, "Employees retrieved successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<IEnumerable<EmployeeResponse>>.ErrorResponse($"Error retrieving employees: {ex.Message}");
            }
        }

        public async Task<ApiResponse<EmployeeResponse>> GetByIdAsync(int idEmployee)
        {
            try
            {
                var data = await _repo.GetByIdAsync(idEmployee);
                if (data == null)
                    return ApiResponse<EmployeeResponse>.ErrorResponse("Employee not found", 404);
                return ApiResponse<EmployeeResponse>.SuccessResponse(data, "Employee retrieved successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<EmployeeResponse>.ErrorResponse($"Error retrieving employee: {ex.Message}");
            }
        }

        public async Task<ApiResponse<int>> CreateAsync(CreateEmployeeRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.FirstName))
                    return ApiResponse<int>.ErrorResponse("First name is required", 400);
                if (string.IsNullOrWhiteSpace(request.LastName))
                    return ApiResponse<int>.ErrorResponse("Last name is required", 400);

                var newId = await _repo.CreateAsync(request);
                if (newId <= 0)
                    return ApiResponse<int>.ErrorResponse("Failed to create employee");

                return ApiResponse<int>.SuccessResponse(newId, "Employee created successfully", 201);
            }
            catch (Exception ex)
            {
                return ApiResponse<int>.ErrorResponse($"Error creating employee: {ex.Message}");
            }
        }

        public async Task<ApiResponse<bool>> UpdateAsync(int idEmployee, UpdateEmployeeRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.FirstName))
                    return ApiResponse<bool>.ErrorResponse("First name is required", 400);
                if (string.IsNullOrWhiteSpace(request.LastName))
                    return ApiResponse<bool>.ErrorResponse("Last name is required", 400);

                var existing = await _repo.GetByIdAsync(idEmployee);
                if (existing == null)
                    return ApiResponse<bool>.ErrorResponse("Employee not found", 404);

                await _repo.UpdateAsync(idEmployee, request);
                return ApiResponse<bool>.SuccessResponse(true, "Employee updated successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.ErrorResponse($"Error updating employee: {ex.Message}");
            }
        }

        public async Task<ApiResponse<bool>> DeleteAsync(int idEmployee)
        {
            try
            {
                var existing = await _repo.GetByIdAsync(idEmployee);
                if (existing == null)
                    return ApiResponse<bool>.ErrorResponse("Employee not found", 404);

                await _repo.DeleteAsync(idEmployee);
                return ApiResponse<bool>.SuccessResponse(true, "Employee deleted successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.ErrorResponse($"Error deleting employee: {ex.Message}");
            }
        }

        public async Task<ApiResponse<IEnumerable<EmployeeCatalogDto>>> GetCatalogAsync(string tipo)
        {
            try
            {
                var data = await _repo.GetCatalogAsync(tipo);
                return ApiResponse<IEnumerable<EmployeeCatalogDto>>.SuccessResponse(data, "Catalog retrieved successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<IEnumerable<EmployeeCatalogDto>>.ErrorResponse($"Error retrieving catalog: {ex.Message}");
            }
        }
    }
}
