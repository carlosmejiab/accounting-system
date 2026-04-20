using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using Dapper;

namespace WebApiRoofing.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CatalogsController : ControllerBase
    {
        private readonly string _connectionString;

        public CatalogsController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string not found.");
        }

        /// <summary>
        /// Get all titles for contacts
        /// </summary>
        [HttpGet("titles")]
        public async Task<IActionResult> GetTitles()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                var titles = await connection.QueryAsync<TitleDto>(
                    "usp_AyE_GetTitles",
                    commandType: CommandType.StoredProcedure
                );

                return Ok(new { success = true, data = titles });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get all banks
        /// </summary>
        [HttpGet("banks")]
        public async Task<IActionResult> GetBanks()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                var banks = await connection.QueryAsync<BankDto>(
                    "usp_AyE_GetBanks",
                    commandType: CommandType.StoredProcedure
                );

                return Ok(new { success = true, data = banks });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get all employees
        /// </summary>
        [HttpGet("employees")]
        public async Task<IActionResult> GetEmployees()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                var employees = await connection.QueryAsync<EmployeeDto>(
                    "usp_AyE_GetEmployees",
                    commandType: CommandType.StoredProcedure
                );

                return Ok(new { success = true, data = employees });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get all payment terms
        /// </summary>
        [HttpGet("payment-terms")]
        public async Task<IActionResult> GetPaymentTerms()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                var paymentTerms = await connection.QueryAsync<PaymentTermDto>(
                    "usp_AyE_GetPaymentTerms",
                    commandType: CommandType.StoredProcedure
                );

                return Ok(new { success = true, data = paymentTerms });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get all preferred channels for contacts
        /// </summary>
        [HttpGet("preferred-channels")]
        public async Task<IActionResult> GetPreferredChannels()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                var channels = await connection.QueryAsync<PreferredChannelDto>(
                    "usp_AyE_GetPreferredChannels",
                    commandType: CommandType.StoredProcedure
                );

                return Ok(new { success = true, data = channels });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // DTOs
        private class TitleDto
        {
            public int IdTitle { get; set; }
            public string TitleName { get; set; } = string.Empty;
            public int Order { get; set; }
        }

        private class BankDto
        {
            public int IdBank { get; set; }
            public string BankName { get; set; } = string.Empty;
            public int Order { get; set; }
        }

        private class EmployeeDto
        {
            public int IdEmployee { get; set; }
            public string FirstName { get; set; } = string.Empty;
            public string LastName { get; set; } = string.Empty;
            public string FullName { get; set; } = string.Empty;
            public string? Email { get; set; }
            public string? MobilePhone { get; set; }
            public string? LocationName { get; set; }
            public string? PositionName { get; set; }
        }

        private class PaymentTermDto
        {
            public int IdPaymentTerms { get; set; }
            public string PaymentTermsName { get; set; } = string.Empty;
            public int Order { get; set; }
        }

        private class PreferredChannelDto
        {
            public int IdPreferredChannel { get; set; }
            public string PreferredChannelName { get; set; } = string.Empty;
            public int Order { get; set; }
        }
    }
}
