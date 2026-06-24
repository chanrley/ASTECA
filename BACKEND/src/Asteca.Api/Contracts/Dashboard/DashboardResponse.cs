using Asteca.Api.Contracts.Ordens;

namespace Asteca.Api.Contracts.Dashboard;

public record DashboardResponse(
    int OsEmAberto,
    int ProntasParaRetirada,
    decimal FaturamentoTotal,
    int TotalClientes,
    List<OrdemServicoDto> OrdensRecentes,
    Dictionary<string, int> DistribuicaoPorStatus,
    List<OrdemServicoDto> AparelhosProntos);
