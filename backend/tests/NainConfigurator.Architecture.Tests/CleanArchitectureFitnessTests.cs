using NetArchTest.Rules;
using Xunit;

namespace NainConfigurator.Architecture.Tests;

public sealed class CleanArchitectureFitnessTests
{
    private static readonly System.Reflection.Assembly DomainAssembly = typeof(NainConfigurator.Domain.ConfigurationEvaluator).Assembly;
    private static readonly System.Reflection.Assembly ApplicationAssembly = typeof(NainConfigurator.Application.PublicConfigurator).Assembly;
    private static readonly System.Reflection.Assembly InfrastructureAssembly = typeof(NainConfigurator.Infrastructure.InfrastructureRegistration).Assembly;

    [Fact]
    public void DomainShouldNotHaveDependencyOnOuterLayers()
    {
        var result = Types.InAssembly(DomainAssembly)
            .ShouldNot()
            .HaveDependencyOnAny(
                "NainConfigurator.Application",
                "NainConfigurator.Infrastructure",
                "NainConfigurator.PublicHost",
                "NainConfigurator.OperationsHost",
                "NainConfigurator.Worker",
                "NainConfigurator.Hosting")
            .GetResult();

        Assert.True(result.IsSuccessful, $"Domain layer has illegal dependencies on outer layers: {string.Join(", ", result.FailingTypeNames ?? [])}");
    }

    [Fact]
    public void ApplicationShouldNotHaveDependencyOnInfrastructureOrHosts()
    {
        var result = Types.InAssembly(ApplicationAssembly)
            .ShouldNot()
            .HaveDependencyOnAny(
                "NainConfigurator.Infrastructure",
                "NainConfigurator.PublicHost",
                "NainConfigurator.OperationsHost",
                "NainConfigurator.Worker",
                "NainConfigurator.Hosting")
            .GetResult();

        Assert.True(result.IsSuccessful, $"Application layer has illegal dependencies: {string.Join(", ", result.FailingTypeNames ?? [])}");
    }

    [Fact]
    public void InfrastructureShouldNotHaveDependencyOnHosts()
    {
        var result = Types.InAssembly(InfrastructureAssembly)
            .ShouldNot()
            .HaveDependencyOnAny(
                "NainConfigurator.PublicHost",
                "NainConfigurator.OperationsHost",
                "NainConfigurator.Worker")
            .GetResult();

        Assert.True(result.IsSuccessful, $"Infrastructure layer has illegal dependencies on host projects: {string.Join(", ", result.FailingTypeNames ?? [])}");
    }

    [Fact]
    public void DomainShouldNotDependOnEntityFrameworkCoreOrSqlClient()
    {
        var result = Types.InAssembly(DomainAssembly)
            .That()
            .ResideInNamespace("NainConfigurator.Domain")
            .ShouldNot()
            .HaveDependencyOnAny(
                "Microsoft.EntityFrameworkCore",
                "Microsoft.Data.SqlClient")
            .GetResult();

        Assert.True(result.IsSuccessful, $"Domain types must not depend on database libraries: {string.Join(", ", result.FailingTypeNames ?? [])}");
    }
}
