namespace Asteca.Domain.Exceptions;

/// <summary>Violação de uma regra de negócio do domínio (não um erro de infraestrutura).</summary>
public class DomainException : Exception
{
    public DomainException(string message) : base(message) { }
}
