!macro customUnInstall
  MessageBox MB_YESNO "Do you want to completely delete your Split application data (including your local database)?" /SD IDNO IDYES Accepted IDNO Skipped
  Accepted:
    RMDir /r "$APPDATA\${APP_FILENAME}"
    !ifdef APP_PRODUCT_FILENAME
      RMDir /r "$APPDATA\${APP_PRODUCT_FILENAME}"
    !endif
    Goto done
  Skipped:
    Goto done
  done:
!macroend
