CLIENT APPLICATION (Located in SharpPcapTest-master)

BEFORE COMPILING
Install WinPcap at http://www.winpcap.org/ on a Windows machine
Install TCPDUMP/LIBPCAP at http://www.tcpdump.org/ on a Linux machine
Currently not intended to work on Mac.

Compilation Instructions:

Running the program:
Run SharpPcapTest-master/SharpPcapTest/bin/Debug/SharpPcapTest.exe
Console menu should open, listing the available network network adapters available. Select the network adapter you would like the program to watch and report data on.

SERVER APPLICATION (Located on Amazon Web Services)
Server is already configured.
Information on the HTTP methods that are accepted can be found in the "TestAPI" in AWS API Gateway.
Information on the Lamda function that is run can be found in "TestGetSQL" function in AWS Lambda (code uploaded to AWS-Lambda/handler.py in this repository).
Information on the MySQL database can be viewed on the "testdb" database instance in AWS RDS.

VISUALIZER APPLICATION ( )
