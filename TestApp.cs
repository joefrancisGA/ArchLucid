using System;
using ArchLucid.TestSupport;

namespace TestApp
{
    class Program
    {
        static void Main(string[] args)
        {
            var ex = SqlExceptionTestFactory.Create(40613);
            Console.WriteLine($"Exception: {ex.Message}, Number: {ex.Number}");
        }
    }
}