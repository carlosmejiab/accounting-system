using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApiRoofing.Application.DTOs.StorageConfig;
using WebApiRoofing.Application.Interfaces.Services;

namespace WebApiRoofing.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class StorageConfigController : ControllerBase
    {
        private readonly IStorageConfigService _svc;
        public StorageConfigController(IStorageConfigService svc) => _svc = svc;

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var r = await _svc.GetAsync();
            return r.Success ? Ok(r) : StatusCode(r.StatusCode, r);
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] UpdateStorageConfigRequest req)
        {
            var r = await _svc.UpdateAsync(req);
            return r.Success ? Ok(r) : StatusCode(r.StatusCode, r);
        }
    }
}
