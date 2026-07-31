namespace NainConfigurator.Infrastructure.Persistence;

public interface IPersistenceFaultInjector
{
    Task OnConfigurationPersistedBeforeCommitAsync(
        CancellationToken cancellationToken);
}

internal sealed class NoOpPersistenceFaultInjector
    : IPersistenceFaultInjector
{
    public Task OnConfigurationPersistedBeforeCommitAsync(
        CancellationToken cancellationToken) =>
        Task.CompletedTask;
}
