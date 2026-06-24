namespace Asteca.Api.Contracts.Faturamento;

public record FaturamentoMesDto(int Ano, int Mes, decimal Total, int Quantidade);

public record FaturamentoMensalResponse(List<FaturamentoMesDto> Meses, decimal Total, int Quantidade);
