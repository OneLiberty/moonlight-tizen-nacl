FROM ubuntu:22.04 as base

ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Etc/UTC
RUN apt-get update && apt-get install -y \
	make \
	cmake \
	expect \
	git \
	ninja-build \
	python2 \
	unzip \
	wget \
	&& rm -rf /var/lib/apt/lists/*

# Some of Samsung scripts make reference to python,
# but Ubuntu only provides /usr/bin/python2.
RUN ln -sf /usr/bin/python2 /usr/bin/python

# Use a non-root user from here on
RUN useradd -m -s /bin/bash moonlight
USER moonlight
WORKDIR /home/moonlight

# Install Tizen Studio
RUN wget -nv -O web-cli_Tizen_Studio_5.6_ubuntu-64.bin 'https://download.tizen.org/sdk/Installer/tizen-studio_5.6/web-cli_Tizen_Studio_5.6_ubuntu-64.bin' && \
	chmod a+x web-cli_Tizen_Studio_5.6_ubuntu-64.bin && \
	./web-cli_Tizen_Studio_5.6_ubuntu-64.bin --accept-license /home/moonlight/tizen-studio && \
	rm web-cli_Tizen_Studio_5.6_ubuntu-64.bin
ENV PATH=/home/moonlight/tizen-studio/tools/ide/bin:/home/moonlight/tizen-studio/tools:${PATH}

# Prepare Tizen signing cerficates
RUN tizen certificate -a Moonlight -f Moonlight -p 1234 && \
	tizen security-profiles add -n Moonlight -a /home/moonlight/tizen-studio-data/keystore/author/Moonlight.p12 -p 1234

# Workaround to package applications without gnome-keyring
RUN sed -i 's|/home/moonlight/tizen-studio-data/keystore/author/Moonlight.pwd||' /home/moonlight/tizen-studio-data/profile/profiles.xml && \
	sed -i 's|/home/moonlight/tizen-studio-data/tools/certificate-generator/certificates/distributor/tizen-distributor-signer.pwd|tizenpkcs12passfordsigner|' /home/moonlight/tizen-studio-data/profile/profiles.xml

# Install Samsung NaCl SDK
RUN wget -nv -O nacl_sdk.zip 'https://developer.samsung.com/smarttv/file/55e181c4-fb5e-4d25-82df-f85b3b864dab' && \
	unzip nacl_sdk.zip && \
	rm nacl_sdk.zip

# Build moonlight
COPY --chown=moonlight . ./moonlight-tizen-nacl

RUN export NACL_SDK_ROOT=/home/moonlight/pepper_63 && \
	cd moonlight-tizen-nacl && \
	make

RUN mkdir -p build/static build/pnacl/Release

RUN pepper_63/toolchain/linux_pnacl/bin/pnacl-translate -arch arm moonlight-tizen-nacl/pnacl/Release/moonlight-chrome.pexe -o build/pnacl/Release/moonlight-chrome-arm.nexe 

# Copy the required files
RUN cp -r moonlight-tizen-nacl/index.html \
         moonlight-tizen-nacl/config.xml \
         moonlight-tizen-nacl/icons/icon128.png \
         moonlight-tizen-nacl/*.nmf \
         build/ && \
     cp -r moonlight-tizen-nacl/static/* build/static/ && \
     mv build/icon128.png build/icon.png && \
     mv build/*.nmf build/pnacl/Release/

# Package and sign application
# Effectively runs `tizen package -t wgt -- build/widget`,
# but uses an expect cmdfile to automate the password prompt.
RUN echo \
	'set timeout -1\n' \
	'spawn tizen package -t wgt -- build\n' \
	'expect "Author password:"\n' \
	'send -- "1234\\r"\n' \
	'expect "Yes: (Y), No: (N) ?"\n' \
	'send -- "N\\r"\n' \
	'expect eof\n' \
| expect

RUN mv build/MoonlightNaCl.wgt .

# remove unneed files
RUN rm -rf \
	moonlight-tizen-nacl \
	pepper_63 \
	tizen-package-expect.sh \
	web-cli_Tizen_Studio_5.6_ubuntu-64.bin \
	.package-manager \
	.wget-hsts

# Use a multistage build to reclaim space from deleted files
FROM ubuntu:22.04
COPY --from=base / /
USER moonlight
WORKDIR /home/moonlight

# Add Tizen Studio to path
ENV PATH=/home/moonlight/tizen-studio/tools/ide/bin:/home/moonlight/tizen-studio/tools:${PATH}

# RUN sdb connect 192.168.1.26 && tizen install -n Moonlight.wgt
