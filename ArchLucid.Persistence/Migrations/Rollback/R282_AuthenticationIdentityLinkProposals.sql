/*
  R282: Rollback 282_AuthenticationIdentityLinkProposals.sql — drop pending identity link proposals.
*/

IF OBJECT_ID(N'dbo.AuthenticationIdentityLinkProposals', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.AuthenticationIdentityLinkProposals;
END;
GO
