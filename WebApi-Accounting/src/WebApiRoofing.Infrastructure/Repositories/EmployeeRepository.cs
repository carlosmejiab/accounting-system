using Dapper;
using System.Data;
using WebApiRoofing.Application.DTOs.Employees;
using WebApiRoofing.Application.Interfaces.Repositories;
using WebApiRoofing.Infrastructure.Data;

namespace WebApiRoofing.Infrastructure.Repositories
{
    public class EmployeeRepository : IEmployeeRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public EmployeeRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        // ─────────────────────────────────────────────────────────────
        //  GET ALL — usa usp_AyE_GetEmployees (activos, con joins)
        // ─────────────────────────────────────────────────────────────
        public async Task<IEnumerable<EmployeeResponse>> GetAllAsync()
        {
            using var connection = _connectionFactory.CreateConnection();
            var rows = await connection.QueryAsync<dynamic>(
                "usp_AyE_GetEmployees",
                commandType: CommandType.StoredProcedure
            );
            return rows.Select(MapToResponse);
        }

        // ─────────────────────────────────────────────────────────────
        //  GET BY ID — SQL inline con joins para nombres de catálogo
        // ─────────────────────────────────────────────────────────────
        public async Task<EmployeeResponse?> GetByIdAsync(int idEmployee)
        {
            const string sql = @"
                SELECT e.IdEmployee, e.FirstName, e.LastName,
                       ISNULL(e.FirstName + ' ' + e.LastName, '') AS FullName,
                       e.Email, e.MobilePhone, e.State,
                       e.IdLocation, e.IdPosition,
                       loc.Description AS LocationName,
                       pos.Description AS PositionName
                FROM   dbo.Employees e
                LEFT   JOIN TablaMaestra loc ON e.IdLocation = loc.IdTabla AND loc.Groups = 'Location'
                LEFT   JOIN TablaMaestra pos ON e.IdPosition = pos.IdTabla AND pos.Groups = 'PositionEmployee'
                WHERE  e.IdEmployee = @IdEmployee";

            using var connection = _connectionFactory.CreateConnection();
            var row = await connection.QueryFirstOrDefaultAsync<dynamic>(sql, new { IdEmployee = idEmployee });
            return row == null ? null : MapToResponse(row);
        }

        // ─────────────────────────────────────────────────────────────
        //  CREATE — SQL inline para obtener SCOPE_IDENTITY()
        //  (usp_AyE_Employees @TIPO=1 no retorna el nuevo ID)
        // ─────────────────────────────────────────────────────────────
        public async Task<int> CreateAsync(CreateEmployeeRequest request)
        {
            const string sql = @"
                INSERT INTO dbo.Employees
                    (IdLocation, IdPosition, LastName, FirstName, Email, MobilePhone, State, CreationDate, ModificationDate)
                VALUES
                    (@IdLocation, @IdPosition, @LastName, @FirstName, @Email, @MobilePhone, '1', GETDATE(), GETDATE());
                SELECT CAST(SCOPE_IDENTITY() AS INT);";

            using var connection = _connectionFactory.CreateConnection();
            return await connection.ExecuteScalarAsync<int>(sql, new
            {
                IdLocation  = request.IdLocation,
                IdPosition  = request.IdPosition,
                LastName    = request.LastName?.Trim(),
                FirstName   = request.FirstName?.Trim(),
                Email       = request.Email,
                MobilePhone = request.MobilePhone,
            });
        }

        // ─────────────────────────────────────────────────────────────
        //  UPDATE — SQL inline para control total de campos
        // ─────────────────────────────────────────────────────────────
        public async Task UpdateAsync(int idEmployee, UpdateEmployeeRequest request)
        {
            const string sql = @"
                UPDATE dbo.Employees SET
                    IdLocation       = @IdLocation,
                    IdPosition       = @IdPosition,
                    LastName         = @LastName,
                    FirstName        = @FirstName,
                    Email            = @Email,
                    MobilePhone      = @MobilePhone,
                    State            = @State,
                    ModificationDate = GETDATE()
                WHERE IdEmployee = @IdEmployee";

            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync(sql, new
            {
                IdEmployee  = idEmployee,
                IdLocation  = request.IdLocation,
                IdPosition  = request.IdPosition,
                LastName    = request.LastName?.Trim(),
                FirstName   = request.FirstName?.Trim(),
                Email       = request.Email,
                MobilePhone = request.MobilePhone,
                State       = request.IsActive ? "1" : "0",
            });
        }

        // ─────────────────────────────────────────────────────────────
        //  DELETE — soft delete via usp_AyE_Employees @TIPO=3
        // ─────────────────────────────────────────────────────────────
        public async Task DeleteAsync(int idEmployee)
        {
            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync(
                "usp_AyE_Employees",
                new { IdEmployee = idEmployee, State = "0", TIPO = 3 },
                commandType: CommandType.StoredProcedure
            );
        }

        // ─────────────────────────────────────────────────────────────
        //  GET CATALOG — usp_AyE_Listar_Tablas_Todo @TIPO
        //  Tipos válidos: 'Location', 'PositionEmployee'
        // ─────────────────────────────────────────────────────────────
        public async Task<IEnumerable<EmployeeCatalogDto>> GetCatalogAsync(string tipo)
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<EmployeeCatalogDto>(
                "usp_AyE_Listar_Tablas_Todo",
                new { TIPO = tipo },
                commandType: CommandType.StoredProcedure
            );
        }

        // ─────────────────────────────────────────────────────────────
        //  HELPER
        // ─────────────────────────────────────────────────────────────
        private static EmployeeResponse MapToResponse(dynamic r)
        {
            var d = (IDictionary<string, object>)r;
            return new EmployeeResponse
            {
                IdEmployee   = (int)d["IdEmployee"],
                FirstName    = d.TryGetValue("FirstName",    out var fn)  && fn  != DBNull.Value ? (string)fn  : string.Empty,
                LastName     = d.TryGetValue("LastName",     out var ln)  && ln  != DBNull.Value ? (string)ln  : string.Empty,
                FullName     = d.TryGetValue("FullName",     out var fln) && fln != DBNull.Value ? (string)fln : string.Empty,
                Email        = d.TryGetValue("Email",        out var em)  && em  != DBNull.Value ? (string)em  : null,
                MobilePhone  = d.TryGetValue("MobilePhone",  out var mp)  && mp  != DBNull.Value ? (string)mp  : null,
                IdLocation   = d.TryGetValue("IdLocation",   out var il)  && il  != DBNull.Value ? (int?)Convert.ToInt32(il) : null,
                IdPosition   = d.TryGetValue("IdPosition",   out var ip)  && ip  != DBNull.Value ? (int?)Convert.ToInt32(ip) : null,
                LocationName = d.TryGetValue("LocationName", out var loc) && loc != DBNull.Value ? (string)loc : null,
                PositionName = d.TryGetValue("PositionName", out var pos) && pos != DBNull.Value ? (string)pos : null,
                State        = d.TryGetValue("State",        out var st)  && st  != DBNull.Value ? Convert.ToString(st) : null,
            };
        }
    }
}
