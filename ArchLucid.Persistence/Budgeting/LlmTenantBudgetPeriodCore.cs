using System.Globalization;
namespace ArchLucid.Persistence.Budgeting;
public static class LlmTenantBudgetPeriodCore {
 public static (int,int) ReadUtcYearMonth(TimeProvider? tp=null){var u=(tp??TimeProvider.System).GetUtcNow().UtcDateTime;return(u.Year,u.Month);}
 public static (int,int) ParseUtcYearMonth(string k){var p=k.Split('-');if(p.Length!=2)throw new FormatException();int y=int.Parse(p[0]),m=int.Parse(p[1]);Validate(y,m);return(y,m);}
 public static string FormatUtcYearMonth(int y,int m){Validate(y,m);return string.Format(System.Globalization.CultureInfo.InvariantCulture,"{0:0000}-{1:00}",y,m);}
 public static string ResolveMonthlyPeriodKey(TimeProvider? tp=null){var (y,m)=ReadUtcYearMonth(tp);return FormatUtcYearMonth(y,m);}
 public static DateOnly ParseUtcDailyPeriodKey(string k)=>DateOnly.ParseExact(k,"yyyy-MM-dd",CultureInfo.InvariantCulture);
 public static void Validate(int y,int m){if(y<2000||y>2100||m<1||m>12)throw new ArgumentOutOfRangeException();}
 public static void ValidateUtcYearMonth(int y,int m)=>Validate(y,m);
 public static bool RowVersionsMatch(byte[] a,byte[] e){ArgumentNullException.ThrowIfNull(a);ArgumentNullException.ThrowIfNull(e);return a.AsSpan().SequenceEqual(e);}
 public static bool IsDailyHardCapBlocked(long c,long r,long add,long cap)=>c+r+add>cap;
 public static bool IsMonthlyHardCapBlocked(decimal c,decimal r,decimal add,decimal cap)=>c+r+add>cap;
 public static bool ShouldEmitTokenWarnAudit(long o,long n,long w,bool aw)=>!aw&&o<w&&n>=w;
 public static bool ShouldEmitUsdWarnAudit(decimal o,decimal n,decimal w,bool aw)=>!aw&&o<w&&n>=w;
 public static (bool,string) ResolveMonthlyPeriodKeyMismatch(string k,int sy,int sm){var (ry,rm)=ParseUtcYearMonth(k);return(ry!=sy||rm!=sm,FormatUtcYearMonth(sy,sm));}
}
