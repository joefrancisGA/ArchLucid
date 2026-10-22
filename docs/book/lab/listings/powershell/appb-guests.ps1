Get-MgUser -All -Filter "userType eq 'Guest'" `
    -Property 'id,displayName,mail,externalUserState,createdDateTime'
