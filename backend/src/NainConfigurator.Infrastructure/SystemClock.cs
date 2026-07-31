using NainConfigurator.Application;

namespace NainConfigurator.Infrastructure;

public sealed class SystemClock : IClock
{
    public DateTime UtcNow => DateTime.UtcNow;
}
