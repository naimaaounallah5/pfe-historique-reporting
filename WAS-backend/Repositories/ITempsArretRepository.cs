using WAS_backend.DTOs;

namespace WAS_backend.Repositories
{
    public interface ITempsArretRepository
    {
        Task<TempsArretResponseDTO> GetTempsArret(TempsArretQueryParams queryParams);
    }
}