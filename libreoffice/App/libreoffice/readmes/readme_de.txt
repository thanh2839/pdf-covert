
======================================================================
LibreOffice 25.2 ReadMe
======================================================================


Die aktuelle Version dieser Readme-Datei findet sich unter https://git.libreoffice.org/core/tree/master/README.md.

Diese Datei enthält wichtige Informationen zur Software LibreOffice. Es wird empfohlen, diese Informationen aufmerksam zu lesen, bevor die Installation gestartet wird.

Die LibreOffice-Community ist für die Weiterentwicklung dieser Software zuständig und lädt Sie ein, als Mitglied der Community beizutragen. Falls Sie ein neuer Anwender sind, können Sie sich auf der LibreOffice-Seite umfassend über das LibreOffice-Projekt und die Community um das Projekt herum informieren. Besuchen Sie https://de.libreoffice.org/.

Ist LibreOffice tatsächlich für jeden Anwender frei?
----------------------------------------------------------------------

LibreOffice darf von jedem frei verwendet werden. Sie können diese Kopie von LibreOffice auf beliebig vielen Computern installieren und für beliebige Zwecke verwenden (einschließlich kommerzielle Nutzung, öffentliche Verwaltung und Bildung). Für weitere Informationen lesen Sie bitte den Lizenztext, der im LibreOffice-Download enthalten ist.

Warum ist LibreOffice für jeden Anwender frei?
----------------------------------------------------------------------

Sie können diese Kopie von LibreOffice kostenlos benutzen, weil einzelne Beitragende und Firmensponsoren die Software entwerfen, entwickeln, testen, übersetzen, dokumentieren, unterstützen, vermarkten und auf verschiedene Weise dazu beitragen, LibreOffice zu dem zu machen, was es heute ist – die führende Open Source Office-Software für Heim- und Firmenanwender.

Wenn Sie diese Anstrengungen würdigen und sicherstellen möchten, dass LibreOffice auch in Zukunft verfügbar sein wird, tragen Sie am besten selbst zum Projekt bei. Lesen Sie https://de.libreoffice.org/community/ für weitere Informationen. Jeder kann einen eigenen Beitrag leisten.

----------------------------------------------------------------------
Hinweise zur Installation
----------------------------------------------------------------------

LibreOffice erfordert eine aktuelle Version von Java Runtime Environment (JRE) für die volle Funktionalität. JRE ist nicht Teil des LibreOffice-Installationspakets, es sollte deshalb separat installiert werden.

Systemvoraussetzungen
----------------------------------------------------------------------

* Microsoft Windows 7 SP1, 8, 8.1 Update (S14) oder 10

Bitte beachten, dass Administratorrechte für die Installation benötigt werden.

Um die Registrierung von LibreOffice als Standardanwendung für Dateiformate von Microsoft Office zu erzwingen oder zu unterdrücken, die folgenden Parameter beim Aufruf des Installationsprogramms verwenden:

* REGISTER_ALL_MSO_TYPES=1 erzwingt die Registrierung von LibreOffice als Standardanwendung für Dateiformate von Microsoft Office.
* REGISTER_NO_MSO_TYPES=1 verhindert die Registrierung von LibreOffice als Standardanwendung für Dateiformate von Microsoft Office.

Bitte sicherstellen, dass genügend freier Speicherplatz im temporären Verzeichnis des Systems vorhanden ist und dass Schreib-, Lese- und Ausführungsrechte gesetzt sind. Alle laufenden Programme sollten geschlossen werden, bevor mit der Installation begonnen wird.

Installation von LibreOffice auf Debian/Ubuntu-basierten Linuxsystemen
----------------------------------------------------------------------

Für Anweisungen, wie ein Sprachpaket installiert wird (nachdem die US-englische Version von LibreOffice installiert ist), bitte den Abschnitt „Installation eines Sprachpaketes“ unten lesen.

Nachdem das heruntergeladene Archiv entpackt ist, werden Sie sehen, dass der Inhalt in ein Unterverzeichnis entpackt wurde. Öffnen Sie einen Dateimanager und wechseln Sie in das Verzeichnis, das mit „LibreOffice_“ beginnt, gefolgt von der Versionsnummer und einigen Plattforminformationen.

Dieses Verzeichnis enthält ein Unterverzeichnis "DEBS". Wechseln Sie in das Verzeichnis "DEBS".

Rechtsklicken Sie innerhalb des Verzeichnisses und wählen Sie "Im Terminal öffnen". Ein Kommandozeilenfenster wird geöffnet. Geben Sie folgende Befehlszeile auf der Kommandozeile ein (Sie werden aufgefordert, das Root-Kennwort einzugeben, bevor das Kommando ausgeführt wird):

Die folgenden Befehle installieren LibreOffice und die Pakete zur Desktopintegration (sie lassen sich einfach kopieren und in einen Terminal einfügen, anstatt zu versuchen, sie einzugeben):

sudo dpkg -i *.deb

Der Installationsprozess ist jetzt vollständig und es sollten sich Icons für alle LibreOffice-Anwendungen im Bereich Programme/Büroanwendungen des Menüs Ihres Desktops befinden.

Installation von LibreOffice auf Fedora, openSUSE, Mandriva und anderen Linuxsystemen, die RPM-Pakete verwenden
----------------------------------------------------------------------

Für Anweisungen, wie ein Sprachpaket installiert wird (nachdem die US-englische Version von LibreOffice installiert ist), bitte den Abschnitt „Installation eines Sprachpaketes“ unten lesen.

Nachdem das heruntergeladene Archiv entpackt ist, werden Sie sehen, dass der Inhalt in ein Unterverzeichnis entpackt wurde. Öffnen Sie einen Dateimanager und wechseln Sie in das Verzeichnis, das mit „LibreOffice_“ beginnt, gefolgt von der Versionsnummer und einigen Plattforminformationen.

Dieses Verzeichnis enthält ein Unterverzeichnis "RPMS". Wechseln Sie in das Verzeichnis "RPMS".

Rechtsklicken Sie innerhalb des Verzeichnisses und wählen Sie »Im Terminal öffnen«. Ein Kommandozeilenfenster wird geöffnet. Geben Sie folgende Befehlszeile auf der Kommandozeile ein (Sie werden aufgefordert, das Root-Kennwort einzugeben, bevor das Kommando ausgeführt wird):

Für Fedora-basierte Systeme: sudo dnf install *.rpm

Für Mandriva-basierte Systeme: sudo urpmi *.rpm

Für andere RPM-basierte Systeme (openSUSE und so weiter): rpm -Uvh *.rpm

Der Installationsprozess ist jetzt vollständig und es sollten sich Icons für alle LibreOffice-Anwendungen im Bereich Programme/Büroanwendungen des Menüs Ihres Desktops befinden.

Alternativ kann das Skript 'install' verwendet werden, welches sich im obersten Verzeichnis dieses Archivs befindet, um eine Installation als Nutzer durchzuführen. Das Skript wird LibreOffice so einrichten, dass es ein eigenes Profil für diese Installation hat, welches vom normalen LibreOffice-Profil getrennt ist. Bitte beachten, dass dies nicht die Systemintegration installieren wird, wie die Desktop-Menüeinträge und die Registrierungen der Desktop-MIME-Typen.

Hinweise bezüglich der Desktopintegration für Linuxdistributionen, die in den Installationshinweisen nicht gesondert betrachtet wurden
----------------------------------------------------------------------

Es sollte recht einfach sein, LibreOffice auf hier nicht spezifisch betrachteten Linux-Distributionen zu installieren. Unterschiede könnten sich hauptsächlich bei der Desktopintegration ergeben.

Das Verzeichnis "RPMS" (beziehungsweise "DEBS") enthält außerdem ein Paket mit dem Namen "libreoffice25.2-freedesktop-menus-25.2.0.1-1.noarch.rpm" (beziehungsweise "libreoffice25.2-debian-menus_25.2.0.1-1_all.deb" oder ähnlich). Dies ist ein Paket für alle Linux-Distributionen, welche die Spezifikationen/Empfehlungen von Freedesktop.org unterstützen (https://de.wikipedia.org/wiki/Freedesktop.org) und ist für die Installation auf anderen Linux-Distributionen vorgesehen, die in den oben genannten Anweisungen nicht behandelt werden.

Installation eines Sprachpakets
----------------------------------------------------------------------

Das Sprachpaket für die gewünschte Sprache und Plattform herunterladen. Dieses ist am gleichen Ort wie das Basis-Installationspaket verfügbar. Das heruntergeladene Paket über eine Dateiverwaltung in ein beliebiges Verzeichnis (zum Beispiel auf Ihren Arbeitsplatz) entpacken. Alle LibreOffice-Anwendungen (einschließlich des Schnellstarters, falls gestartet) beenden.

In das Verzeichnis wechseln, in das das Paket entpackt wurde.

Nun in das Verzeichnis wechseln, das während des Entpackens erstellt wurde. Für das deutsche Sprachpaket für ein 32-Bit-Debian/Ubuntu-basiertes System heißt das Verzeichnis beispielsweise "LibreOffice_", plus einige Versionsinformationen und "Linux_x86_langpack-deb_de".

Nun in das Verzeichnis wechseln, das die zu installierenden Pakete enthält. Auf Debian-/Ubuntu-basierten Systemen ist es das Verzeichnis DEBS. Auf Fedora-, openSuse- oder Mandriva-Systemen ist es RPMS.

Rechtsklicken Sie in der Dateiverwaltung auf das Verzeichnis und wählen Sie »Im Terminal öffnen«. Führen Sie in der Eingabeaufforderung den Befehl zum Installieren des Sprachpaketes aus (alle unten aufgeführten Kommandos werden wahrscheinlich nach Ihrem Root-Kennwort fragen):

Für Debian/Ubuntu-basierte Systeme: sudo dpkg -i *.deb

Für Fedora-basierte Systeme: su -c 'dnf install *.rpm'

Für Mandriva-basierte Systeme: sudo urpmi *.rpm

Für andere Systeme, die RPM benutzen (openSUSE und so weiter): rpm -Uvh *.rpm

Starten Sie nun eine der Anwendungen von LibreOffice – beispielsweise Writer. Wählen Sie »Extras – Optionen… – Sprachen und Gebietsschemata – Allgemein«. Öffnen Sie die Liste „Benutzeroberfläche“ und wählen Sie die Sprache aus, die Sie gerade installiert haben. Wenn Sie möchten, machen Sie dasselbe für „Gebietsschema“, „Standardwährung“ und „Standardsprachen für Dokumente“.

Nachdem Sie diese Einstellungen vorgenommen haben, klicken Sie auf »OK«. Der Dialog wird geschlossen und Sie sehen einen Hinweis, dass die Änderungen erst nach einem Neustart von LibreOffice übernommen werden (denken Sie daran, auch den Schnellstarter zu beenden, sofern dieser gestartet ist).

Beim nächsten Start von LibreOffice wird es in der gerade installierten Sprache starten.

----------------------------------------------------------------------
Probleme beim Programmstart
----------------------------------------------------------------------

Probleme beim Start von LibreOffice (beispielsweise das Hängenbleiben der Anwendung) oder der Darstellung auf dem Bildschirm sind häufig auf den vom System verwendeten Treiber der Grafikkarte zurückzuführen. Problemen dieser Art muss der von Ihnen verwendeten Treiber der Grafikkarte aktualisiert beziehungsweise testweise der standardmäßige Treiber der Grafikkarte Ihres Betriebssystems verwendet werden.

----------------------------------------------------------------------
ALPS/Synaptics Notebook-Touchpads unter Windows
----------------------------------------------------------------------

Aufgrund eines Problems im Windows-Treiber können Sie nicht in Ihren LibreOffice-Dokumenten rollen, indem Sie mit dem Finger über das ALPS/Synaptics-Touchpad fahren.

Um das Rollen per Touchpad zu ermöglichen, müssen die folgenden Zeilen in die Datei "C:\Programme\Synaptics\SynTP\SynTPEnh.ini" eingefügt und dann der Computer neu gestartet werden:

[LibreOffice]

FC = "SALFRAME"

SF = 0x10000000

SF |= 0x00004000

Der Speicherort der Konfigurationsdatei kann je nach Windows-Version abweichen.

----------------------------------------------------------------------
Tastenkombinationen
----------------------------------------------------------------------

In LibreOffice können nur Tastenkombinationen verwendet werden, die nicht vom Betriebssystem verwendet werden. Sollte in LibreOffice eine Tastenkombination nicht wie in der LibreOffice-Hilfe beschrieben funktionieren, muss überprüft werden, ob diese Kombination bereits vom Betriebssystem verwendet wird. Um diesen Konflikt aufzuheben, kann die Belegung des Betriebssystems umdefiniert beziehungsweise aufgehoben werden. Alternativ lässt sich auch in LibreOffice fast jede Tastenkombination ändern. Weitere Hinweise zu diesem Thema bieten die LibreOffice-Hilfe sowie die Hilfe des Betriebssystems.

----------------------------------------------------------------------
Probleme beim Senden von Dokumenten als E-Mails von LibreOffice
----------------------------------------------------------------------

Beim Versenden eines Dokuments über »Datei – Senden – Dokument als E-Mail…« oder »Datei – Senden – PDF als E-Mail…« können Probleme auftreten (Programm stürzt ab oder hängt). Dies liegt an der Windows-Systemdatei „Mapi“ (Messaging Application Programming Interface), die in einigen Dateiversionen Probleme verursacht. Leider lässt sich das Problem nicht auf eine bestimmte Versionsnummer eingrenzen. Für weitere Informationen besuchen Sie https://www.microsoft.com, um in der Microsoft Knowledge Base nach "mapi dll" zu suchen.

----------------------------------------------------------------------
Wichtige Hinweise zur Barrierefreiheit
----------------------------------------------------------------------

Weiterführende Informationen zur Barrierefreiheit in LibreOffice sind unter https://de.libreoffice.org/get-help/accessibility/ zu finden.

----------------------------------------------------------------------
Anwenderunterstützung
----------------------------------------------------------------------

Die Supportseite bietet verschiedene Möglichkeiten an Hilfe zu LibreOffice. Ihre Frage wurde möglicherweise bereits beantwortet – überprüfen Sie das Forum der Gemeinschaft unter https://ask.libreoffice.org/ oder durchsuchen Sie die Archive der Mailingliste "users@de.libreoffice.org" unter https://listarchives.libreoffice.org/de/users/. Alternativ können Sie Ihre Fragen an users@de.libreoffice.org senden. Wenn Sie die Liste abonnieren möchten (um E-Mail-Antworten zu erhalten), senden Sie eine leere E-Mail an: users+subscribe@de.libreoffice.org.

Prüfen Sie auch die FAQs auf der LibreOffice-Webseite.

----------------------------------------------------------------------
Fehler & Probleme melden
----------------------------------------------------------------------

Unser System, um Fehler zu melden, zu verfolgen und zu lösen, ist derzeit BugZilla und steht unter https://bugs.documentfoundation.org/ zur Verfügung. Wir möchten jeden ermutigen, selbst Fehler zu melden, die auf der jeweiligen Plattform auftreten könnten. Das aktive Melden von Fehlern ist einer der wichtigsten Beiträge, den die Anwender-Community machen kann, um die Weiterentwicklung von LibreOffice zu unterstützen.

----------------------------------------------------------------------
Mitmachen – aber wie?
----------------------------------------------------------------------

Für die LibreOffice-Community ist es von hohem Wert, wenn Sie sich aktiv in die Entwicklung dieses bedeutenden Open-Source-Projekts einbringen.

Als Anwender sind Sie bereits ein wertvoller Teil im Entwicklungsprozess der Office-Suite und wir möchten Sie ermutigen, auch langfristig in der Community mitzuwirken. Schauen Sie auf unseren Seiten unter https://de.libreoffice.org/community/ nach und helfen Sie mit.

Wie anfangen?
----------------------------------------------------------------------

Der einfachste Einstieg ist es, sich auf einer oder auf mehreren Mailinglisten einzuschreiben, eine Weile mitzulesen und in den Mailarchiven die Themen zu lesen, die seit dem Bestehen des LibreOffice-Projektes im Oktober 2000 diskutiert wurden. Sobald Sie sich dazu bereit fühlen, senden Sie eine E-Mail mit einer kurzen Selbstvorstellung und packen direkt mit an. Falls Sie bereits mit Open-Source-Projekten vertraut sind, schauen Sie unter https://de.libreoffice.org/community/developers/ nach, ob eine Aufgabe für Sie dabei ist.

Mailinglisten abonnieren
----------------------------------------------------------------------

Hier sind einige der Mailinglisten aufgeführt, auf denen Sie sich einschreiben können: https://de.libreoffice.org/get-help/mailing-lists/

* Neuigkeiten: announce@de.libreoffice.org – *Für alle Anwender empfohlen* (niedriges Mailaufkommen)
* Benutzerhilfe: users@de.libreoffice.org – *Anwenderunterstützung für LibreOffice* (hohes Mailaufkommen)
* Marketing: marketing@global.libreoffice.org – *LibreOffice bekanntmachen* (hohes Mailaufkommen, englisch)
* Generelle Entwicklerliste: libreoffice@lists.freedesktop.org (hohes Mailaufkommen, englisch)

Einem oder mehreren Projekten beitreten
----------------------------------------------------------------------

Selbst mit geringen Erfahrungen in Programmierung und Softwaredesign können Sie wichtige Beiträge zu diesem bedeutenden Open-Source-Projekt leisten. Ja, genau Sie!

Wir hoffen, dass Sie Spaß bei der Arbeit mit dem neuen LibreOffice 25.2 haben und sich uns online anschließen.

Die LibreOffice-Community

----------------------------------------------------------------------
Benutzter / Modifizierter Quelltext
----------------------------------------------------------------------

Teile des Copyright 1998, 1999 James Clark. Teile des Copyright 1996, 1998 Netscape Communications Corporation.
